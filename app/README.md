Here’s a concise “full product” doc you can drop into README or share with others.

Product Overview

Next.js 16 app (app router) with Prisma/Postgres (Supabase) backend.
Content: Projects (covers, tags/tech, categories, featured), Pages (About/Contact/custom), Testimonials, Newsletter subscribers, Contact clicks, Project reactions, Project views analytics.
Auth: NextAuth (GitHub) protecting admin routes.
Media: Cover uploads to Supabase storage.
Feeds/SEO: /sitemap.xml (from app/sitemap.ts), /rss, /atom, per-project OG (/api/og/projects/[slug]), per-page OG (/api/og/page/[slug]).
Local Setup

Prereqs: Node 18+, npm.
Install deps: npm install (uses package-lock.json).
Env: copy .env.example (if present) to .env.local and set:
DATABASE_URL (Postgres; Supabase: include sslmode=require).
NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (for storage uploads).
NextAuth creds (e.g., GitHub) per your existing setup.
Prisma: run migrations / push schema, then generate client:
npx prisma migrate dev (or npx prisma db push)
npx prisma generate
Start dev: npm run dev (uses .env.local via dotenv-cli).
Key Scripts (package.json)

npm run dev — start Next dev.
npm run build / npm start — production build/run.
npm run lint — ESLint.
npm test — Vitest (validation helpers).
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
/admin/categories: create/delete categories (guard delete if in use); sort order.
/admin/analytics: date-filtered views, referrers/devices charts, recent views, contact click counts, project reactions table, CSV export.
/admin/analytics/export: CSV for views (date-bounded).
Public Features

Homepage: hero CTAs, featured projects carousel (custom swipe/auto-rotate, 3-up), subscribe form, links to About/Projects.
Projects list: search, category filters, pagination (10/page), compact cards with views/reactions.
Project detail: Markdown content, tags/tech, share buttons, outbound tracking, cover image, reactions (like/dislike), related projects, prev/next nav.
About/Contact: pull content from Page records; Contact links tracked; subscribe form.
Feeds/SEO: sitemap, RSS/Atom, OG image routes.
Uploads

Endpoint: /api/upload/cover uses Supabase service role key.
Required env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
Analytics/Tracking

Project views tracked via ProjectView table.
Contact clicks tracked via /api/contact/track.
Outbound links tracked via /api/track/outbound.
Reactions via /api/projects/[slug]/reaction (visitor cookie predicta_vid).
Testing

Vitest in tests/validation.test.ts (slug/validation helpers). Run with npm test.
Gotchas / Current Issues to watch

Ensure DB sequences are in sync if you see “Unique constraint failed on id” (reset sequence in DB).
Apply pending migrations for newer models (Page, Category relation, ContactClick, ProjectReaction) before using admin.
Swiper/react-responsive-carousel are no longer used; carousel is custom (swipe + framer-motion). react-swipeable version is ^7.0.0.
Deployment

Build: npm run build, run with npm start.
Set all env vars in hosting provider.
Run Prisma migrations against the production DB before first deploy or when schema changes.