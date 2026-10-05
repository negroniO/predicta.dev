# Phase 3 — Product and UX

Implemented locally on 2026-10-05. No production data changes or deployment.

## Administrator editing

All project, page and category mutation forms use the shared recovery component. JavaScript submissions request a JSON acknowledgement with a relative administrator destination; ordinary form submissions retain their 303 redirect behavior. Successful saves navigate to a fresh page so version tokens and controlled inputs reset together.

Failed saves keep text, Markdown, slug edits and selected cover files in the current form. A focused inline alert explains validation failures, duplicate slugs, expired sessions and stale edits. Conflicts ask the editor to compare the latest version in another tab; retrying never bypasses the server's version check. An ambiguous network failure advises checking the saved item before retrying because the server may already have committed it.

Submitting forms block duplicate interaction and announce progress. Field labels are linked to their controls. Form status identifies unsaved changes and whether saving will keep a draft private or make content public. New pages and projects default to drafts; existing publication states remain selected.

The administrator layout tracks dirty forms, including hidden chip values and selected files. Following a link prompts before discarding edits. Reload, closing the tab, and document Back/Forward navigation use the browser's leave-page warning. Administrator links use full document navigation to preserve that browser behavior. Cancelling navigation retains edits and files. Other dirty forms on the page remain protected when one form saves.

Warnings are not autosave or recovery after a browser crash. Mobile browsers may suppress leave-page dialogs, especially when the app is closed by the operating system. No drafts are stored in browser storage. Without JavaScript, forms retain native server validation and redirects, but enhanced inline recovery and navigation warnings are unavailable.

## Visitor feedback

Subscriptions keep the email after failures, offer a retry button, announce success, and explain temporary service failures and rate-limit retry timing. Inputs are protected from changes during submission.

Reaction controls show loading progress and unavailable counts distinctly from zero. An initial failure offers a retry; failed mutations explain the error without changing the displayed counts. Successful retries update the count and pressed state.

Existing project search empty-state recovery is retained and covered by the new browser checks. Broad streaming loading boundaries are intentionally absent so draft and missing pages retain their HTTP 404 status.

## Verification

`npm run test:browser` applies migrations to disposable loopback PostgreSQL, checks schema parity, builds the application, starts the local server, runs the original HTTP suite, exercises product flows in Chromium at desktop (1280px) and mobile (390px) widths, runs the foundation HTTP suite including the Redis outage test, then stops the application server. All test records use isolated fixtures and are cleaned up. See the README for starting and stopping the disposable services.

The browser suite covers real duplicate-slug and stale-write errors, successful keyboard retry, draft defaults, focus on errors, file retention, simulated validation/network/session failures, cancellation and acceptance of navigation, reload/Back protection, viewport overflow, empty-result reset, reaction recovery and newsletter retries. Validation/network/service failures are simulated where deterministic failure is needed; successful retries and database conflicts use the real local application.

Local checks passed: 140 unit tests, 55 security/regression HTTP checks, 64 foundation HTTP checks, 64 desktop/mobile browser checks, zero-warning lint, production build, TypeScript, and migration/schema parity. The mobile inline-error layout was also inspected visually. CI installs Chromium and runs this extended suite; the updated workflow has not yet run remotely. Browser coverage is Chromium at two viewport sizes, not a claim of Safari/Firefox or physical-device testing.

Production deployment prerequisites from [Phase 0](phase-0-deployment.md) and Redis configuration from [Phase 2](phase-2-foundation.md) still apply. The integration build uses test settings in `.next`; rebuild with the intended environment before running or deploying the site normally.
