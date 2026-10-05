# Predicta.dev

Portfolio and content management application built with Next.js, React, Prisma/PostgreSQL, GitHub authentication and Supabase cover storage.

## Local setup

For an isolated preview with sample data, use Node 22 and Docker Desktop:

```bash
npm run dev:local
```

Open **http://127.0.0.1:3001**. This starts separate PostgreSQL 17 and Redis containers, applies the four migrations, adds sample projects without overwriting existing local edits, and runs Next.js using `.next-local`. It explicitly overrides production endpoints and preserves your environment files. An existing app on port 3000 can keep running.

To try the admin editor without configuring GitHub OAuth:

```bash
npm run local:admin
```

This opens a separate Google Chrome window with an eight-hour session for a test administrator in the local database. It uses the normal authentication/authorization checks; no login bypass is added to the app. Close that window to end the session. Real GitHub sign-in and cover uploads are not configured in this isolated preview; the public pages, local analytics, reactions, subscriptions and admin text editing use local services.

Stop the development server with Ctrl+C. Stop its database/Redis containers with `npm run local:stop`; local content is kept in a Docker volume for the next session. Integration tests use different services and ports. Preview browser profiles and build output are Git-ignored.

For manually configured local development:

Use Node 22.12+ (22.x) and a development PostgreSQL database. Preserve any existing environment files; use `.env.example` as a template for missing settings in `.env.local`.

```bash
nvm install
nvm use
npm ci
npx dotenv -e .env.local -- prisma generate
```

For a new, empty development database only:

```bash
npx dotenv -e .env.local -- prisma migrate deploy
npm run dev
```

Existing databases need schema/migration reconciliation before deployment. See [Phase 0 release notes](docs/phase-0-deployment.md), including the pending production credential rotation and migration prerequisites. Do not use `db push` or a database reset to reconcile production.

GitHub OAuth must use the callback URL for your environment (`http://localhost:3000/api/auth/callback/github` locally). Administrator access defaults to `negroniO`'s numeric GitHub ID. Cover uploads require the configured Supabase `project-images` bucket and a server-only service role key.

Optional local sample data is additive and requires explicit opt-in:

```bash
NODE_ENV=development ALLOW_DEV_SEED=1 npx dotenv -e .env.local -- npm run prisma:seed
```

The seed rejects non-loopback database hosts and production mode. It preserves existing projects and analytics.

## Phase 1 quick wins

See [Phase 1 release notes](docs/phase-1-quick-wins.md) for pagination, accessibility, exports, feed and metadata changes. Set `NEXT_PUBLIC_SITE_URL` to your deployment origin before building; it is shared by canonicals, sharing, sitemap and feeds.

## Checks

```bash
npm test -- --run
npm run lint
npm run build
```

## Phase 2 foundation

See [Phase 2 release notes](docs/phase-2-foundation.md) for validation, API limits, analytics, indexes and CI. Production public writes require Redis by default. Configure `RATE_LIMIT_IP_HEADER` only for a client-IP header overwritten by your trusted proxy; otherwise each endpoint scope uses a shared bucket.

Run the repeatable HTTP suite with Docker running and Node 22 selected:

```bash
npm run test:services
npm run test:integration
npm run test:services:stop
```

The runner uses disposable loopback PostgreSQL/Redis, applies migrations, checks schema drift, builds and starts the app, and runs both HTTP suites. It supplies test-only authentication/storage settings. It rejects remote service URLs and databases not named `predicta_test`. Do not load deployment environment files into this command. Rebuild with your normal settings after running it: `.next` contains the test build.

GitHub Actions runs lint, unit tests and the same integration runner using fresh service containers, without deployment secrets. The application overview is in [app/README.md](app/README.md).

## Phase 3 product improvements

Administrator forms retain edits and selected files after errors, warn before leaving unsaved changes, and default new pages/projects to private drafts. Visitor subscription and reaction controls now explain failures and retries. See [Phase 3 release notes](docs/phase-3-product.md).

To include desktop/mobile browser checks, install Chromium once and run the extended suite:

```bash
npx playwright install chromium
npm run test:services
npm run test:browser
npm run test:services:stop
```

This includes the production build and both HTTP suites. CI installs Chromium and runs the extended suite automatically. An existing Chromium executable can be selected with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

## Release readiness

See the [dependency review](docs/dependency-review.md) and [deployment/rollback runbook](docs/deployment-runbook.md). The latest recorded npm scan has no critical findings, but unresolved high findings remain; this is not production approval.

`/api/health` checks process liveness. `/api/health/ready` checks PostgreSQL and the configured rate-limit backend with bounded, coalesced probes. Neither response exposes infrastructure details. Structured server-error logs correlate handled 5xx responses through `X-Request-ID`. The runbook explains probe limits, monitoring setup, staging checks and backup restoration.

```bash
npm run audit:dependencies
```

The command deliberately fails on the currently unresolved high findings. CI also blocks newly detected critical dependency findings. The integration suite now verifies health behavior during Redis outages and when both dependencies are unavailable.

## Live database audit

The [2026-10-05 read-only audit](docs/live-database-audit-2026-10-05.md) found migration-history drift, one missing legacy column and three missing indexes. These were subsequently fixed with explicit owner approval; the [production execution record](docs/production-db-reconciliation-2026-10-05.md) confirms zero schema drift, four matching migrations and preserved application data. The original audit describes the pre-change state.

Repeat with `node scripts/audit-db.mjs` after configuring `AUDIT_DATABASE_URL` in the ignored `.env.audit.local` file. The runner requires `psql`, accepts only the dedicated audit login, uses read-only transactions/timeouts, and writes sanitized catalog/aggregate evidence to `/tmp/predicta-live-db-audit.json`. It does not read `.env` or apply repairs.

The [reconciliation rehearsal](docs/db-reconciliation-rehearsal-2026-10-05.md) passed against a live application snapshot restored into disposable PostgreSQL 17, preserving all original records and sequence values. Run `node scripts/rehearse-db-reconciliation.mjs --fixture-only` for the local synthetic test or `--restore-backup BACKUP_ID` for a retained historical snapshot. Neither mode writes to production. The old live-export rehearsal now refuses to run because the production drift it tested has been resolved.

The [retained encrypted backups and recovery procedure](docs/production-db-reconciliation-2026-10-05.md) document the pre-change recovery copies under ignored `.local-backups/`. Keep the ignored `.env.recovery-key.local` file as well as the archives. Production database reconciliation is complete; application deployment and real OAuth/storage staging checks remain separate work.
