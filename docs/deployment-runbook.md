# Deployment, monitoring and rollback

Prepared 2026-10-05. This is an execution runbook, not evidence that the application has been deployed. The [live database audit](live-database-audit-2026-10-05.md), [application-snapshot rehearsal](db-reconciliation-rehearsal-2026-10-05.md), retained encrypted recovery copies and [approved production database reconciliation](production-db-reconciliation-2026-10-05.md) are complete. Credential rotation verification, provider/storage restore coverage, real OAuth/storage checks and hosting configuration remain outstanding.

## Release prerequisites

1. Name the release operator, hosting project, staging and production origins, previous compatible release artifact, database migration operator and rollback decision maker. Record these in the release ticket; hosting details are not established by this repository.
2. Rotate the previously exposed database credential through the provider, update all affected secret stores and ignored local files, restart consumers and verify the old credential no longer authenticates. Never copy credentials into release notes or shell command history. Retain the rotated credential during rollback.
3. Review the dated dependency report and rerun `npm run audit:dependencies`. An advisory scan is evidence of known package findings, not proof of exploitability or absence of vulnerabilities. Resolve release-relevant findings before deployment; document any accepted exception, conditions and expiry. Do not use `npm audit fix --force` as a release step.
4. Complete read-only live-schema/migration-history inspection and reconciliation described in [Phase 0](phase-0-deployment.md). Verify all four committed migrations against a restored copy. Do not use `db push`, reset, blind baseline/resolve, or drop objects to hide drift.
5. Secure a recent restorable database backup and a separate copy of uploaded objects. Confirm retention, recovery point and recovery time requirements against the actual provider plan. Record a successful restore drill before authorizing production migrations.

## Environment separation

Use separate staging database, Redis and upload storage resources, an environment-specific GitHub OAuth app/callback and distinct session secrets. Never point staging at production just to make a build pass. The integration runner uses disposable services and dummy credentials; it is not a staging OAuth or storage test.

| Setting | Deployment requirement |
| --- | --- |
| Node | 22.12+ within 22.x, selected by `.nvmrc` |
| `DATABASE_URL` | Explicit target secret with provider-supported TLS/pooling settings; verify target without printing credentials |
| `NEXTAUTH_URL` | Exact HTTPS origin for that environment |
| `NEXTAUTH_SECRET`, `GITHUB_ID`, `GITHUB_SECRET` | Server-only, environment-specific secrets |
| `ADMIN_GITHUB_IDS` | Confirmed owner numeric ID; an empty override denies access |
| `NEXT_PUBLIC_SITE_URL` | Correct public origin at build time |
| `NEXT_PUBLIC_SUPABASE_URL` | Correct storage project at build and runtime |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for the intended project-images bucket |
| `RATE_LIMIT_BACKEND`, `REDIS_URL` | Redis for distributed production deployments; verify read/write/expiry permissions |
| `RATE_LIMIT_IP_HEADER` | Only a client-IP header the actual trusted ingress overwrites; verify spoof resistance through that ingress |

An unset IP-header setting conservatively shares endpoint quotas among visitors. Explicit memory mode is process-local and resets on restart. Do not select it accidentally to suppress Redis errors.

Next loads `.env.local` before `.env`; Prisma normally loads `.env`. Use a controlled deployment environment that injects the intended secrets explicitly. Before any migration command, independently confirm the target project/database and approval. Do not infer the target from the active editor tab.

## Staging rehearsal

From the reviewed source revision and lockfile:

```sh
npm ci
npx prisma generate
npm run audit:dependencies
npm run lint -- --max-warnings=0
npm test -- --run
npx playwright install chromium
npm run test:services
npm run test:browser
npm run test:services:stop
```

The integration suite overwrites `.next` with test configuration. Build a fresh deployment artifact using the actual staging settings afterward. On an empty or reconciled staging database, the migration operator runs `npx prisma migrate status`, then `npx prisma migrate deploy`, then verifies status again. Build with `npm run build` and run with `npm start` or the hosting provider's equivalent. Migrations must not run automatically from public requests or concurrent application instances.

Verify all of the following through the real staging hostname:

- Liveness and readiness are 200; no database/Redis details appear in their responses.
- Owner GitHub sign-in, sign-out and session renewal work; a non-owner is denied. Verify the real OAuth callback, not only an injected test session.
- Create a private draft, edit it, upload a small cover, preview it and publish/unpublish it. Confirm draft/missing routes return 404 across pages, API, sitemap, feeds and OG endpoints.
- In two tabs, save conflicting edits. Confirm the stale form retains text/files and cannot overwrite the newer version. Check keyboard and mobile editing.
- A successful upload is readable from the intended bucket; anonymous writes are denied. Covers remain public assets even when their associated content is private.
- Subscription and reaction writes succeed; excessive requests receive 429 and Retry-After. Confirm forged client-IP headers do not create unlimited independent quotas.
- Temporarily make only staging Redis unavailable: public reads and liveness remain usable, public writes fail closed, readiness becomes 503, then recovers after restoration. Never run this exercise against production without separate authorization.
- Canonical, sharing, feed and sitemap origins match staging. Check robots/indexing policy for the staging host at the hosting layer before making it public.

Record the deployed revision, migration status, artifact identity, results and any known exceptions. A passing local suite does not complete this staging checklist.

## Backup and restore drill

Supabase database backups contain database records and storage metadata, but not the uploaded object bytes. Preserve storage objects separately, along with bucket/access-policy configuration and required secret references. Confirm the provider's supported backup/export method for the actual plan. [Supabase backup documentation](https://supabase.com/docs/guides/platform/backups)

Restore into an isolated target, never over the live project as a drill. Prevent restored jobs, integrations or webhooks from sending outbound traffic. Check migration history, representative projects/pages/categories, view and reaction relationships, session tables, row counts and sampled content. Restore copied cover objects and validate representative image URLs and access policies. Record backup timestamp, object inventory, restore duration, validation results and the recovery gap. Store backups encrypted with access restricted to operators; do not commit them.

For a provider-specific restore, follow the [Supabase restore procedure](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore). This runbook intentionally does not include an unverified production restore command.

## Authorized production rollout

After staging evidence, the backup drill, advisory review and explicit production approval:

1. Record current release identity and migration history. Confirm a compatible rollback artifact and operator availability.
2. Apply only the reviewed reconciliation/migration sequence to the confirmed database. The new indexes use normal CREATE INDEX; assess table sizes and write-blocking time before the release window.
3. Deploy the reviewed artifact built for the production origin with the rotated secrets. Verify every instance uses the intended Redis and database settings.
4. Confirm liveness, readiness, public content/draft privacy, owner authentication and a separately authorized write/upload smoke test. Watch structured error events and the hosting provider's HTTP error/latency metrics.
5. Keep the previous compatible artifact available until the observation window is complete. Record the outcome and any follow-up.

The approved production database reconciliation added the nullable legacy column and three indexes, then reconciled migration history after equivalence checks. Normal migration deployment verified no pending changes; application reads passed in read-only transactions. No application deployment, production restore, credential rotation or smoke-test data write was performed. Encrypted pre-change application backups remain available; they exclude owners/ACLs, managed schemas and storage objects and do not establish complete Supabase/storage recovery coverage. The [production execution record](production-db-reconciliation-2026-10-05.md) documents results, timeout handling and recovery limits.

## Monitoring and triage

| Endpoint | Meaning | Use |
| --- | --- | --- |
| `GET /api/health` | 200 `{status: "alive"}`; no dependency calls | Process liveness; do not restart solely because a dependency is down |
| `GET /api/health/ready` | 200 `{status: "ready"}` or 503 `{status: "unavailable"}` | Dependency monitoring or readiness, according to hosting behavior |

Both responses use `Cache-Control: no-store`; failures have `Retry-After: 5`. Dependency samples are cached for five seconds per process, with one shared in-flight check and a 2.5-second response deadline. PostgreSQL uses read-only SELECT 1 through a lazy one-connection probe pool with two-second connection/pool/query timeouts; Redis uses PING and disconnects after each sample. Account for the extra database connection per running instance. Timeout options follow the [Prisma v6 PostgreSQL connector](https://docs.prisma.io/docs/orm/v6/overview/databases/postgresql).

Readiness does not test schema parity, real queries, OAuth, storage permissions, Redis mutation permissions or the rate limiter's current cooldown. A recovered Redis PING can precede successful writes while the limiter's 30-second cooldown expires. Explicit memory mode skips Redis. A permanently hung probe stays coalesced rather than launching more work. Public callers receive no component names, hosts, versions or exception text.

Start with external probes every 30 seconds and alert after three consecutive failures; tune using observed latency and hosting cold starts. Configure monitors and alert recipients in the chosen hosting/monitoring service. This repository does not register an external monitor or send notifications.

Structured JSON events include a UTC timestamp and generated request ID:

- `api_failure`: every handled 5xx, operation, status and a coarse failure category. Error responses include the same ID in JSON and `X-Request-ID`.
- `readiness_changed`: initial dependency state and state transitions, duration and database/rate-limit booleans. Polls without changes do not log repeatedly.
- `rate_limit_unavailable`: limiter connection/command failure, followed by cooldown.
- `auth_failure`: authentication library errors without provider metadata.
- `cover_cleanup_failed`: an uncommitted upload could not be removed.

Logs deliberately exclude raw exceptions, URLs, request bodies, cookies, tokens, email addresses and uploaded content. Logging covers these application paths; it is not distributed tracing, client error collection, a full audit trail or redaction of all hosting/framework logs. Platform request metrics and further instrumentation are still needed for slow-query analysis and comprehensive render-error monitoring.

For a 5xx, correlate the request ID with the operation. Database categories distinguish connection/pool issues from missing schema. For a readiness failure, inspect the state-transition event and provider health/configuration. If only Redis is unavailable, restore it and allow the limiter cooldown to expire; do not disable limits as an automatic fallback. For storage errors, verify the correct project, server-side key, bucket and access policy without logging the key.

## Rollback

An application rollback redeploys the previous reviewed artifact only if it is compatible with the current additive schema. Keep rotated credentials and required security fixes. Do not automatically roll back to the original vulnerable application or remove newly added tables/columns/indexes.

If rollout fails, stop further rollout, retain evidence and classify application/configuration failure versus migration/data failure. Fix configuration or redeploy the compatible artifact first. If a migration partially applied, inspect migration status and actual schema before preparing a repair; never mark it resolved blindly.

Database restoration is a separate, explicitly approved recovery action. It can lose writes after the backup and must be coordinated with uploaded objects, sessions and any external systems. State the recovery point and expected loss, pause writes through an approved mechanism, restore into an isolated target first, validate, and then perform a reviewed cutover. Recheck health and security smoke tests after either rollback path.
