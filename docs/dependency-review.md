# Dependency verification — 2026-10-05

The npm advisory scan completed. Targeted patches removed the reported critical findings, but this is **not a clean dependency report or production approval**. Twenty-four affected package entries remain, including four high-severity entries in npm's production resolution. No production application or credentials were changed.

## Measured results

| Scan | Critical | High | Moderate | Low | Total affected package entries |
| --- | ---: | ---: | ---: | ---: | ---: |
| Before, all dependencies | 2 | 26 | 5 | 1 | 34 |
| After, all dependencies | 0 | 21 | 2 | 1 | 24 |
| Before, omit development dependencies | 1 | 7 | 1 | 0 | 9 |
| After, omit development dependencies | 0 | 4 | 0 | 0 | 4 |

These are npm package-level counts, including inherited findings, not counts of independent exploits. npm reports known advisories and propagates vulnerable dependency relationships; a reported version match does not establish a reachable exploit in this application. [npm audit behavior](https://github.com/npm/cli/blob/latest/docs/lib/content/commands/npm-audit.md)

The [machine-readable evidence](dependency-audit-2026-10-05.json) records remaining packages, resolved versions, advisory URLs/ranges, registry suggestions and the SHA-256 of the audited lockfile. Both full and production scans completed successfully as scans and exited nonzero because findings remain.

## Targeted changes

| Dependency | Before | After | Reason |
| --- | --- | --- | --- |
| next-auth | 4.24.13 | 4.24.15 | Patched release within the existing major; remove authentication advisories |
| vitest | 2.1.9 | 4.1.11 | Address test-server/mocking advisories; verified all unit tests on the new major |
| preact | 10.27.2 | 10.29.8 | Compatible transitive update for the reported VNode issue |
| ws | 8.18.3 | 8.22.0 | Compatible transitive update for disclosure/denial-of-service advisories |
| defu | 6.1.4 | 6.1.7 | Compatible transitive update for prototype pollution |

Vitest's dependency tree changed with that upgrade, including Vite; the application framework and ORM were not migrated. Node remains 22.x. npm 10.8.2 crashed internally while resolving the Vitest upgrade; an isolated npm 11 CLI resolved it. The normal npm CLI subsequently completed a clean `npm ci` for the authentication/Vitest lockfile; the final compatible transitive updates were then checked by build, lint and the full test suite.

The NextAuth provider-binding advisory lists 4.24.15 as patched and describes a multi-provider condition. This app currently configures only GitHub; the scan does not prove that condition was exploitable here. The patch is retained rather than relying on that configuration indefinitely. [NextAuth advisory](https://github.com/nextauthjs/next-auth/security/advisories/GHSA-x445-f3h2-j279)

Vitest 4.1.11 addresses the mock redirect traversal advisory. The project does not configure the Vitest UI server, but the old test tooling was still in the affected version ranges. [Vitest mock advisory](https://github.com/vitest-dev/vitest/security/advisories/GHSA-82fw-gwwq-j7x9), [Vitest UI advisory](https://github.com/vitest-dev/vitest/security/advisories/GHSA-5xrq-8626-4rwp)

## Remaining release work

**First priority: review the Prisma dependency chain.** The production-resolution entries are `prisma`, `@prisma/config`, `deepmerge-ts` and `effect`. The first two inherit the latter findings. Prisma configuration pins deepmerge-ts 7.1.5 and Effect 3.18.4. The application imports Prisma Client for queries; it does not implement an Effect RPC server or directly feed user inputs into Prisma CLI configuration. That is a code-inspection observation, not a blanket exemption or a verified production bundle analysis.

The deepmerge advisory requires recursive object graphs; plain JSON alone does not create that condition. Its patch starts at major version 8. The Effect advisory concerns asynchronous context handling with RPC. Determine actual packaged/reachable code, select a compatible upstream Prisma fix or a separately validated override, and document the resolution. Avoid supplying untrusted repository configuration to deployment tooling. [deepmerge advisory](https://github.com/RebeccaStevens/deepmerge-ts/security/advisories/GHSA-ggr8-5vv4-36mx), [Effect advisory](https://github.com/Effect-TS/effect/security/advisories/GHSA-38f7-945m-qr2g)

**Second priority: update and validate development-tool chains.** Remaining entries cover linting, glob matching, YAML/JSON parsing and browser-target configuration. These can matter when tooling processes untrusted source/configuration; development-only does not mean harmless. Review compatible updates in small groups with lint, build and tests. The registry suggests downgrading eslint-config-next to 14.2.35 and Prisma to 6.12.0 for some inherited findings; those suggestions were not applied because they are not a validated compatibility/security plan for this app.

Do not deploy solely because the critical CI threshold passes. Resolve relevant high findings or record a reviewed, time-limited exception with reachability evidence before release. No such exceptions have been approved in this work.

## Remaining package inventory

“Production resolution” means included by `npm audit --omit=dev`; it is not proof that the package is bundled into a public request handler.

| Package | Locked version(s) | Severity | Production resolution |
| --- | --- | --- | --- |
| `@babel/core` | 7.28.5 | low | No |
| `@humanfs/node` | 0.16.7 | moderate | No |
| `@next/eslint-plugin-next` | 16.3.8 | high | No |
| `@prisma/config` | 6.19.0 | high | Yes |
| `@typescript-eslint/eslint-plugin` | 8.47.0 | high | No |
| `@typescript-eslint/parser` | 8.47.0 | high | No |
| `@typescript-eslint/type-utils` | 8.47.0 | high | No |
| `@typescript-eslint/typescript-estree` | 8.47.0 | high | No |
| `@typescript-eslint/utils` | 8.47.0 | high | No |
| `ajv` | 6.12.6 | moderate | No |
| `brace-expansion` | 1.1.12, 2.0.2 | high | No |
| `braces` | 3.0.3 | high | No |
| `browserslist` | 4.28.0 | high | No |
| `deepmerge-ts` | 7.1.5 | high | Yes |
| `effect` | 3.18.4 | high | Yes |
| `eslint-config-next` | 16.3.8 | high | No |
| `fast-glob` | 3.3.1, 3.3.3 | high | No |
| `flatted` | 3.3.3 | high | No |
| `js-yaml` | 4.1.1 | high | No |
| `micromatch` | 4.0.8 | high | No |
| `minimatch` | 3.1.2, 9.0.5 | high | No |
| `picomatch` | 2.3.1 | high | No |
| `prisma` | 6.19.0 | high | Yes |
| `typescript-eslint` | 8.47.0 | high | No |
## Repeating verification

```sh
npm run audit:dependencies
npm audit --omit=dev --audit-level=high
```

`audit:dependencies` exits nonzero for high/critical findings and uses bounded registry request timeouts. GitHub Actions runs a separate lockfile audit job at the critical threshold; registry failures also fail that job. High findings still require release review. The updated workflow has not run remotely yet.

Local validation passed: 146 unit tests, 55 security/regression HTTP checks, 69 foundation HTTP checks, 64 desktop/mobile browser checks, a separate database-and-Redis-unavailable health test with ten concurrent probes, production build/TypeScript, zero-warning lint, and migration/schema parity.

This scan covers the npm lockfile. It does not scan operating-system/container images, provider infrastructure or a deployed production artifact. `backend/requirements.txt` is unpinned and has no resolved Python lockfile; that dependency set is unverified. The FastAPI file currently contains a dummy prediction implementation and no application integration was found in the frontend/CI search. Before deploying that backend, resolve/pin its actual environment and perform a dedicated Python advisory scan. No Python backend was deployed or upgraded here.
