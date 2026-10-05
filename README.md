# Predicta.dev

Portfolio and content management application built with Next.js, React, Prisma/PostgreSQL, GitHub authentication and Supabase cover storage.

## Local setup

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
