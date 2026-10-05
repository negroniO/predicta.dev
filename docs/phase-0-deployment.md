# Phase 0 release notes

Local implementation and verification completed on 2026-10-03. These changes have not been deployed. No production database writes or credential changes were made.

## Application changes

- GitHub sign-in is restricted to the confirmed owner, `negroniO` (numeric ID `203515807`). Every privileged request also checks the persisted GitHub account, including sessions created before this restriction. `ADMIN_GITHUB_IDS` can override the comma-separated numeric allowlist; an empty value denies everyone.
- Admin writes and uploads require a matching `Origin`. Set `NEXTAUTH_URL` to the exact deployment origin. Admin pages, CSV exports and slug validation share the same authorization policy.
- Cover uploads accept PNG/JPEG/WebP only, validate both MIME and bytes, limit files to 5 MiB and form bodies to 8 MiB, cap decoding at 20 megapixels, and re-encode to WebP at a maximum dimension of 2400 pixels. Failed project saves remove only their newly uploaded object. Existing covers are retained.
- Only projects marked `Completed` or `In Progress` are public. Drafts and unknown statuses are filtered from pages, navigation, search, APIs, tracking, reactions, feeds, sitemap and OG images. Database-backed public pages are dynamic so publication changes take effect on the next request. This increases database reads relative to static caching.
- Markdown is sanitized at rendering, including editor previews; JSON-LD escapes `<`. Production CSP no longer allows `unsafe-eval`. Image optimization accepts only the configured Supabase host and the public `project-images` bucket path.
- Project quick actions update only their intended field. Edits/deletes require the submitted `updatedAt` version and return HTTP 409 when stale. Reload before retrying a conflict. The seed requires explicit development opt-in and a loopback database, and never clears or overwrites existing projects.
- Next.js/eslint-config-next are pinned to 16.3.8, React/react-dom to 19.3.0, sharp to 0.35.5 and sanitize-html to 2.18.0. Node 22.12+ within the 22.x line is required; `.nvmrc` selects Node 22. The sanitizer's patched parser requires this runtime. See the [Next.js security releases](https://nextjs.org/blog) and [sanitizer changelog](https://github.com/apostrophecms/apostrophe/blob/main/packages/sanitize-html/CHANGELOG.md).

## Required before production deployment

1. Rotate the exposed database password in the Supabase project settings. Update every affected connection string in hosting secrets and local ignored environment files, including both `.env` and `.env.local` if present. Restart/redeploy all consumers and verify the old credential no longer authenticates. Do not paste the replacement into chat or commit it. This has not been performed: no authenticated Supabase management access is available in this workspace.
2. Inspect the actual production schema and `_prisma_migrations` in read-only mode. The audit connection timed out, so live tables, migration history, RLS and storage policies remain unverified. Obtain a restorable backup before any separately authorized production migration.
3. Compare the live schema to both the historical migrations and `prisma/schema.prisma`. The new migration creates `Category`, `Page`, `ContactClick`, `ProjectReaction` and `Project.categoryId`, retaining historical `Project.category` as Prisma `legacyCategory`. It backfills nonblank category text into the relation without changing project timestamps or content.
4. If production exactly matches the committed historical migrations, this additive migration is the expected next step. If objects already exist from `prisma db push`, **do not blindly run migrate deploy or mark the migration applied**. Prepare a database-specific reconciliation script from the observed drift, validate it on a restored copy, and only baseline/resolve migration history after schema equivalence and preservation checks. If the old `category` column is absent, the final schema also needs that nullable column. Do not use reset, drop or force-reset to fix drift.
5. Configure Node 22, the exact `NEXTAUTH_URL`, server-only secrets and the Supabase project URL at build and runtime. Check that the `project-images` bucket permits public reads but no unauthenticated writes. Cover URLs remain public even when their project is a draft; the draft policy protects project content, not private storage assets.
6. Deploy the verified schema/application together after approval. Verify owner sign-in, non-owner rejection, upload success, published/draft transitions and a stale edit on staging first. OAuth redirects and a successful Supabase storage upload were not exercised against live services.

## Verification performed

- 58 Vitest tests passed, covering authorization, CSRF, unsafe content, image decoding/limits, project mutations, seeding and existing validation helpers.
- 55 HTTP checks passed against the production build and disposable PostgreSQL, including real database sessions, public/draft routes, admin pages, forged uploads, stale-write conflicts, immediate unpublishing and seed preservation.
- Standard `npm run build` (Turbopack), webpack build, TypeScript and ESLint passed. ESLint retains four existing warnings: two plain image elements, one unused related-project prop and one anonymous PostCSS config export.
- All three migrations deployed to a fresh disposable database. The reconciliation migration preserved a legacy project, its category text, timestamp and view record; Prisma reported no difference from the final schema.
- `npm audit` timed out; no complete advisory scan is available. Dependency pin updates do not establish that all transitive packages are vulnerability-free.
- No browser visual/accessibility verification, real OAuth callback, live storage write, production migration or production credential rotation was performed.

## Repeating checks

Use Node 22 (`nvm install && nvm use`), then `npm ci`, `npx prisma generate`, `npm test -- --run`, `npm run lint`, and `npm run build`. Use a development database for local commands. Next.js reads `.env.local` before `.env`; Prisma normally reads `.env`. Explicitly supply the intended database or use `npx dotenv -e .env.local -- prisma ...` to avoid selecting the wrong environment.

For the HTTP suite, create an isolated PostgreSQL database named `predicta_phase0` or `predicta_phase0_clean` on loopback, apply migrations there, and run the production build on `http://127.0.0.1:3107`. Both server and test script must use that same explicit `DATABASE_URL`. Set `NEXTAUTH_URL=http://127.0.0.1:3107`, `ADMIN_GITHUB_IDS=203515807`, a local `NEXTAUTH_SECRET`, dummy OAuth credentials, and empty `REDIS_URL`/storage credentials. Run `node tests/phase0-http.mjs` with that `DATABASE_URL`. The script refuses remote or differently named databases, creates and removes its test users/content, and leaves the local seed examples for inspection. Use a dedicated database, not one containing work you need to keep.
