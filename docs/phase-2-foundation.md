# Phase 2 — Foundation

Implemented locally on 2026-10-05. Production has not been migrated or deployed.

## Validation and errors

Public JSON writes require an object with `application/json`, a maximum 16 KiB body, and bounded typed fields. Malformed JSON returns 400, oversized bodies 413, and unsupported media types 415. Administrator forms retain an 8 MiB transport limit and a 5 MiB image limit. Page/category forms now validate fields centrally; page edits and deletion compare the submitted `updatedAt` version and return 409 after a conflicting edit.

Shared API failures return `{ok: false, error, message, requestId}` with `Cache-Control: no-store`. Unexpected exceptions return a generic 500; logs contain the operation and correlation ID without raw exceptions or submitted data. Unique conflicts return 409, missing records 404, and foreign-key/serialization conflicts 409. The slug-availability endpoint retains its `available` validation response contract. Successful administrator form submissions still redirect with 303.

New tracking records retain only the referrer origin, stripping paths, query strings and fragments. Existing stored referrers are unchanged.

## Rate limiting

Production defaults to Redis; development defaults to a process-local memory limiter capped at 10,000 active keys. Set `RATE_LIMIT_BACKEND=redis` and `REDIS_URL` when testing Redis in development. Explicit `memory` mode is available, but counters reset on restart and are not shared across processes or replicas.

Redis increments and expiry assignment execute in one Lua operation, including repair of counters missing a TTL. This follows the atomicity guidance in the [Redis INCR documentation](https://redis.io/docs/latest/commands/incr/). Each window starts with its first attempt; invalid bodies also consume quota.

| Scope | Requests per 60 seconds |
| --- | ---: |
| Newsletter subscription | 20 |
| Contact/outbound tracking, sharing one counter | 60 |
| Project reactions | 60 |
| View tracking | 120 |

`RATE_LIMIT_IP_HEADER` must identify a client-IP header overwritten by the trusted ingress proxy. Do not select an arbitrary client-controlled header. Valid addresses are hashed before use as counter keys. When the setting is empty or the value is invalid, requests share one bucket per scope; this is conservative but can limit unrelated visitors together. Deployment needs a verified proxy configuration before enabling per-client buckets.

Exceeded quotas return 429 with `Retry-After`. Missing Redis configuration or Redis failures return 503 with a 30-second retry interval; there is no silent bypass. A failed connection/command triggers a process-local 30-second cooldown, then a subsequent request attempts reconnection. Public reads remain available. Redis is connected lazily, so building the app does not require Redis access.

## Query and analytics changes

- `/api/projects` returns a summary array with default limit 50 and maximum 100, omitting full Markdown content. Pass the `X-Next-Cursor` response header as `cursor` on the next request. Fetch full content from `/api/projects/[slug]`. Ordering is stable for unchanged data; concurrent edits can alter pagination.
- Search defaults to 20 results, allows at most 50, and caps query text at 200 characters.
- Dashboard and CSV share one UTC date range: the latest 30 whole days by default, at most 90 days. Reversed ranges are swapped; malformed dates use defaults.
- PostgreSQL aggregates daily views and distinct visitor IDs. The dashboard loads only 20 recent view rows, the top 100 stored referrer values and the top 50 clicked URLs. It no longer loads every view to count days in JavaScript.
- All dashboard sections use the selected range. Reaction totals represent current reaction records last updated during that range, not a historical event log. Distinct visitor IDs are identifiers, not a count of verified people.
- CSV exports return at most 10,000 rows. Larger selections return 422 and ask for a narrower date range, avoiding silent truncation. Existing CSV formula escaping is retained.

The additive migration `20261005120000_query_indexes` adds:

| Index | Query it supports | Tradeoff |
| --- | --- | --- |
| `Project(categoryId)` | Category membership counts and relation lookups | Extra storage and work when project category changes |
| `ContactClick(createdAt)` | Date-filtered click aggregates | Extra work on each tracked click |
| `ProjectReaction(updatedAt)` | Date-filtered reaction aggregates | Extra work on reaction inserts/updates |

Existing view-date indexes remain in place. Index creation and schema parity were checked on disposable PostgreSQL; production workload speedups have not been measured. Normal index creation can block writes, so assess table sizes and deployment timing before applying this migration to a live database.

## Repeatable checks and CI

Use Node 22.12+ (22.x), install dependencies, generate Prisma Client, and start Docker:

```sh
npm ci
npx prisma generate
npm run lint -- --max-warnings=0
npm test -- --run
npm run test:services
npm run test:integration
npm run test:services:stop
```

The Compose project uses PostgreSQL 16 on loopback port 55440 with temporary storage and Redis 7.4 on port 56380 without persistence. The runner refuses remote services and PostgreSQL databases not named `predicta_test`, checks that its HTTP port is free, applies all migrations, checks schema drift, builds the production app, starts it on port 3107, runs both HTTP suites, and stops that server. `.next` then contains test settings; rebuild for ordinary development or deployment. Never point these tests at a database or Redis instance containing useful data.

`.github/workflows/ci.yml` repeats these checks on pushes and pull requests using fresh local services and dummy credentials. Checkout and setup-node actions are pinned to commit SHAs, repository permissions are read-only, and deployment secrets are not needed. The workflow has not yet run on GitHub.

Local verification: production build, TypeScript and zero-warning lint passed; all four migrations applied with zero schema drift; 132 unit tests, 55 security/regression HTTP checks and 64 foundation HTTP checks passed. The foundation suite exercises malformed inputs, pagination, stale edits, UTC filters, concurrent Redis quotas, expiry, missing-TTL repair and Redis outage behavior. Unit tests additionally exercise configuration isolation, memory limits, shared errors and failure cooldown.

## Remaining deployment work

Follow the [Phase 0 deployment prerequisites](phase-0-deployment.md) for credential rotation and reconciliation of the existing live schema before applying migrations. Configure Redis and the trusted client-IP header for the real hosting path, rebuild with the production site origin, then run deployment smoke checks. Dependency advisory verification is still pending from the earlier audit; this phase does not establish a clean advisory scan.
