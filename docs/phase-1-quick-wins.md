# Phase 1 — Quick wins

Implemented locally on 2026-10-03. No production changes, schema changes or new external services were introduced in this phase. Phase 0's production credential rotation and live-schema reconciliation remain pending; see [the deployment prerequisites](phase-0-deployment.md#required-before-production-deployment).

## Behavior changes

- **Project filtering:** searching or changing category returns to the first page. The displayed page is also bounded when the result count shrinks. Empty collections have a separate message, and unsuccessful searches offer a clear-filters button. Search suggestions remain available while keyboard focus moves into them.
- **Homepage and accessibility:** featured cards render immediately in server HTML instead of waiting for a scroll event. Carousel rotation pauses on hover, keyboard focus, manual selection and when off screen, with an explicit pause/resume control. Reduced motion disables rotation. Added a skip link, a single main landmark, visible keyboard focus, named form inputs and pressed states for filters/reactions. The page wrapper no longer initially hides all content behind a JavaScript animation.
- **Feedback:** reactions and clipboard failures show messages; page failures offer a retry action. The cover picker accepts the same PNG/JPEG/WebP formats as the server, and browser form validation blocks an invalid selected file. Newsletter copy now describes registration of interest and contact-based removal; it no longer promises an implemented email cadence or automated unsubscribe facility.
- **Images and maintenance:** project thumbnails use Next Image optimization when their URLs match the permitted Supabase bucket. Other existing image URLs use unoptimized rendering to preserve compatibility. Admin cover previews use explicit dimensions. Removed unused `express`, `d3-shape`, `swiper`, `react-responsive-carousel`, and `react-swipeable` dependencies, their unused declaration/styles, and the remaining lint warnings.
- **Metadata:** `NEXT_PUBLIC_SITE_URL` now supplies the origin for metadata, structured data, share links, feeds, robots and sitemap. `NEXT_PUBLIC_BASE_URL` remains a fallback; otherwise the origin defaults to `https://predicta.dev`. Set the correct origin before building. Removed repeated title suffixes and consolidated the project article metadata on the server. Admin routes emit `noindex`; sitemap entries are deduplicated and omit reserved admin/API page slugs.
- **Feeds:** `/rss`, `/rss.xml` and `/feed.xml` remain supported and now share one RSS implementation; `/atom` uses the same query and escaping. All feeds contain the latest 30 public projects ordered by creation time. XML-special characters and invalid XML controls are handled consistently, and the feed's modification date uses its most recently updated entry. Responses remain uncached so draft transitions are reflected immediately.
- **Analytics/export:** invalid referrers are grouped without throwing a URL parsing error. CSV values are quoted with doubled embedded quotes and real multiline fields; formula-like values receive a text prefix. This follows the general escaping approach described by [OWASP](https://community.owasp.org/attacks/CSV_Injection). CSV cannot guarantee text interpretation across every spreadsheet program or after saving/reopening; the prefix also becomes part of the exported data.

## Verification

- Clean offline dependency installation succeeded, followed by Prisma client generation and the standard production build on Node 22.
- 88 Vitest tests passed, including 30 new checks for CSV/XML/referrer handling and site-origin configuration.
- 55 HTTP regressions passed against a disposable local PostgreSQL database. The fixture now includes special characters in project titles, malformed referrers and formula-like CSV values.
- 26 headless Chrome checks passed against the production build: pagination/filter resets, keyboard suggestions, title/canonical/share URLs, article metadata, reaction failure messages, administrator metadata, cover-picker formats, carousel pause, reduced motion, server-rendered cards without JavaScript, mobile overflow, XML parsing for all four feeds, and absence of browser runtime/hydration errors.
- Desktop (1280px) and mobile (390px) screenshots were inspected. This is targeted browser verification, not a complete accessibility or cross-browser audit. Chrome was run with temporary test tooling outside the application dependencies.
- ESLint reports zero errors and zero warnings. `git diff --check` passes.

## Repeatable repository checks

```bash
nvm use
npm ci
npx dotenv -e .env.local -- prisma generate
npm test -- --run
npm run lint
npm run build
```

Use a development database for local work. The [Phase 0 instructions](phase-0-deployment.md#repeating-checks) describe the disposable-database HTTP suite; its fixtures also cover the Phase 1 export regressions. Real GitHub OAuth and Supabase storage writes were not repeated, and no complete dependency advisory scan is available from the earlier timed-out audit.
