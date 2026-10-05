Application overview. For current setup and release requirements, see [the root README](../README.md) and [Phase 0 release notes](../docs/phase-0-deployment.md).

Product Overview

Next.js 16 app (app router) with Prisma/Postgres (Supabase) backend.
Content: Projects (covers, tags/tech, categories, featured), Pages (About/Contact/custom), Testimonials, Newsletter subscribers, Contact clicks, Project reactions, Project views analytics.
Auth: NextAuth (GitHub) protecting admin routes.
Media: Cover uploads to Supabase storage.
Feeds/SEO: /sitemap.xml (from app/sitemap.ts), /rss, /atom, per-project OG (/api/og/projects/[slug]), per-page OG (/api/og/page/[slug]).
Local Setup

Prereqs: Node 22.12+ (22.x), npm.
Install deps: npm ci (uses package-lock.json).
Env: copy .env.example (if present) to .env.local and set:
DATABASE_URL (Postgres; Supabase: include sslmode=require).
NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (for storage uploads).
NextAuth creds (e.g., GitHub) per your existing setup.
Prisma: for a new, empty development database, run the committed migrations and generate the client:
npx dotenv -e .env.local -- prisma migrate deploy
npx dotenv -e .env.local -- prisma generate
Existing databases require drift inspection and reconciliation first; never reset production.
Start dev: npm run dev (uses .env.local via dotenv-cli).
Key Scripts (package.json)

npm run dev — start Next dev.
npm run build / npm start — production build/run.
npm run lint — ESLint.
npm test — Vitest security and validation regression tests.
Data Model (Prisma highlights)

Project: slug, title, subtitle, description, content, tags[], techStack[], coverImageUrl, categoryId?, featured, status, year, sortOrder, githubUrl, liveUrl, reactions, views.
Category: name, slug, sortOrder.
Page: slug, title, excerpt, content, status (published/draft).
NewsletterSubscriber: email.
ProjectView: path, visitorId, deviceType, referrer, userAgent (analytics).
ProjectReaction: kind (“like”/“dislike”), visitorId.
ContactClick: href, referrer, userAgent.
Testimonial, User/Account/Session (NextAuth).
Admin Areas

/admin (Projects): add/edit/delete projects; cover upload (Supabase); tags/tech chips; category select; featured toggle; sort order bump; slug uniqueness validation; search; shows views/reactions.
/admin/pages: create/edit/delete static pages (About/Contact/custom) with Markdown; slug/status validation.
Categories on /admin: create/delete categories (guard delete if in use); sort order.
/admin/analytics: date-filtered views, referrers/devices charts, recent views, contact click counts, project reactions table, CSV export.
/api/admin/analytics/export: CSV for views (date-bounded).
Public Features

Homepage: hero CTA, featured projects carousel (3-up, pausable rotation), registration of interest in future updates, links to About/Projects.
Projects list: search, category filters, pagination (10/page), compact cards with views/reactions.
Project detail: Markdown content, tags/tech, share buttons, outbound tracking, cover image, reactions (like/dislike), related projects, prev/next nav.
About/Contact: pull content from Page records; Contact links tracked; subscribe form.
Feeds/SEO: sitemap, RSS/Atom (latest 30 published projects; all three RSS URLs remain supported), OG image routes. NEXT_PUBLIC_SITE_URL controls the public origin.
Uploads

Endpoint: /api/upload/cover requires owner authorization and a same-origin request, validates PNG/JPEG/WebP bytes, and re-encodes to WebP before storage.
Required env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
Analytics/Tracking

Project views tracked via ProjectView table.
Contact clicks tracked via /api/contact/track.
Outbound links tracked via /api/track/outbound.
Reactions via /api/projects/[slug]/reaction (visitor cookie predicta_vid).
Testing

Vitest in tests/*.test.ts (authorization, content, uploads, mutations, seeding and validation). Run with npm test -- --run. The disposable-database HTTP suite is documented in the Phase 0 release notes.
Gotchas / Current Issues to watch

Ensure DB sequences are in sync if you see “Unique constraint failed on id” (reset sequence in DB).
The additive reconciliation migration covers Page, Category, ContactClick and ProjectReaction. Inspect actual schema/history before applying it to an existing database.
Unused carousel, Express and d3-shape packages were removed in Phase 1. Featured projects use Framer Motion, keyboard-accessible pagination and a pause control.
Deployment

Build: npm run build, run with npm start.
Set all env vars in hosting provider.
Follow the Phase 0 release notes before production deployment. Production schema reconciliation is complete; see the [execution record](../docs/production-db-reconciliation-2026-10-05.md). Credential rotation verification and application deployment remain outstanding.
