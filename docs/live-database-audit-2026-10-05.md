# Predicta.dev — Live database audit

Read-only inspection performed on 2026-10-05 using the dedicated `predicta_audit` account. The connection succeeded over TLS to PostgreSQL 17.6. Application records, credentials, schema, grants and migration history were not changed.

**Later update:** DB-01, DB-02 and DB-03 were resolved in the owner's separately approved [production reconciliation](production-db-reconciliation-2026-10-05.md). Production now matches the repository schema and four migration checksums. The findings below preserve the original pre-change audit; the other findings and visibility limits were not resolved by the schema repair.

The principal release blocker is confirmed schema and migration-history drift. The current repository must not be deployed with a blind `prisma migrate deploy` against this database. No evidence of orphaned relationships or the tested duplicate keys was found. Database grants deny direct application-table access to the Supabase `anon` and `authenticated` roles, despite RLS being disabled.

## Method and scope

The [audit runner](../scripts/audit-db.mjs) reads only `.env.audit.local`, refuses administrator logins, and uses `BEGIN READ ONLY` followed by `ROLLBACK` for every inspection. Server-side statement and lock timeouts are 10 seconds and 2 seconds; the client additionally bounds each subprocess. The account has no superuser, role/database creation, replication or RLS-bypass privileges, no inherited role memberships, no application-table write privileges and no CREATE privilege in the inspected schemas.

Inspection used PostgreSQL catalogs, aggregate counts and plain `EXPLAIN (FORMAT JSON)`. It did not run `EXPLAIN ANALYZE`, retrieve personal records/tokens/content, execute application functions, or attempt write-based security tests. SQL definition literals are redacted in the saved [evidence](live-database-audit-2026-10-05.json). Queries ran in separate short transactions, so this is an observation window rather than one transactionally consistent backup.

An independent Prisma 6.19 schema comparison used the same restricted account and read-only connection settings. It generated SQL locally and applied nothing.

## Prioritized findings

| ID | Severity | Classification | Finding and evidence | Next action |
| --- | --- | --- | --- | --- |
| DB-01 | High | Confirmed | Only the two November 2025 migrations are recorded, while Category, Page, ContactClick, ProjectReaction and Project.categoryId already exist. The pending reconciliation migration would try to recreate these objects. Evidence: `migration_history`, `tables`, `columns`. | Reconcile a restored copy and verify equivalence before explicitly reconciling migration history. Never blindly baseline or deploy. |
| DB-02 | High | Confirmed | Live Project lacks `category`, which the repository maps as `legacyCategory`. Prisma's schema diff requires adding this nullable text column. | Resolve before deploying this generated client. Queries selecting all Project scalar fields can fail against the current live schema. This does not establish that the currently deployed site's older client is failing. |
| DB-03 | Low at present | Confirmed | Three repository indexes are absent: Project.categoryId, ContactClick.createdAt and ProjectReaction.updatedAt. | Include the existing index migration in the reviewed reconciliation plan. Current tables are tiny; no measured performance emergency justifies a broader indexing change. |
| DB-04 | Medium | Confirmed | One of three project slugs contains uppercase characters, violating the repository's lowercase slug rule. No whitespace, other invalid characters, malformed hyphens or excessive length was counted. | Inspect that item in the admin UI. Plan normalization together with redirects for existing links; do not silently rename it. |
| DB-05 | Medium | Potential risk | All 13 public tables have RLS disabled and no policies were found. However, anon/authenticated have no SELECT/INSERT/UPDATE/DELETE table grants or equivalent column grants. No public views or user-defined public functions were found. | Retain the deny-by-grant posture. Consider RLS as defense in depth after checking the actual application DB role; do not add permissive policies or API grants. |
| DB-06 | Low | Confirmed | Ten session records are expired; none is unexpired at inspection time. | Define retention and a bounded cleanup job outside this audit. Expired rows alone are not evidence of session acceptance or unauthorized access. |
| DB-07 | Informational | Unable to verify | Storage bucket contents/configuration, detailed slow-query statistics and backup/PITR settings were not available through this account. | Review these through the appropriate dashboard or narrowly scoped monitoring access. Do not expand the audit account to administrator privileges. |

## Schema and migration reconciliation

Both recorded migration checksums match their repository SQL files:

- `20251125153248_init`
- `20251125190038_add_newsletter_testimonials`

Both have completion timestamps, no rollback timestamp and no saved migration error logs. These pending repository migrations have no live history entry:

- `20261003120000_reconcile_application_models`
- `20261005120000_query_indexes`

The live schema is ahead of its recorded history but behind the current repository in four places. The independent Prisma comparison reported only:

```sql
ALTER TABLE "Project" ADD COLUMN "category" TEXT;
CREATE INDEX "ContactClick_createdAt_idx" ON "ContactClick"("createdAt");
CREATE INDEX "Project_categoryId_idx" ON "Project"("categoryId");
CREATE INDEX "ProjectReaction_updatedAt_idx" ON "ProjectReaction"("updatedAt");
```

The [review-only SQL](sql/live-schema-reconciliation-review.sql) wraps this physical diff in a transaction with short timeouts and deliberately ends in ROLLBACK. It is not installed as a migration, not applied to production, and not sufficient by itself to fix migration history. Its rollback behavior and the complete reconciliation sequence subsequently passed on a restored application snapshot; see the [rehearsal results](db-reconciliation-rehearsal-2026-10-05.md).

The required release sequence is:

1. Obtain and restore a recent backup into an isolated target; recheck drift there and preserve before/after counts and representative relationships.
2. Apply the reviewed physical reconciliation on that isolated target. Adding the nullable legacy column supplies compatibility only; it cannot reconstruct any historical category text that may have been removed before this audit. Category currently has zero rows, and all existing Project.categoryId values therefore have no assigned category under the valid foreign key.
3. Verify a fresh Prisma comparison reports no remaining physical drift. Check all expected constraints, index definitions and data preservation, not merely object names.
4. Only after equivalence is demonstrated, prepare the explicit migration-history resolution for migrations whose full intended state already exists. Alternatively, reconcile/baseline the first pending migration and let the existing index migration create its indexes normally. Do not apply both approaches to the same indexes.
5. Validate ordinary migration deployment on the reconciled copy and run application regressions, including OAuth/session behavior and a real upload in staging.
6. Obtain separate production approval for the exact reviewed sequence. This audit authorizes none of those live writes.

No historical migration files were edited. The audit does not identify whether the pre-existing unrecorded changes came from `db push`, SQL Editor, or another deployment process.

## Data integrity and size

| Application table | Count observed |
| --- | ---: |
| Project | 3 |
| Category | 0 |
| Page | 1 |
| ProjectView | 208 |
| ProjectReaction | 1 |
| ContactClick | 8 |
| NewsletterSubscriber | 2 |
| Testimonial | 0 |
| User | 1 |
| Account | 1 |
| Session | 10 |
| VerificationToken | 0 |

The 13 inspected public tables, including migration history and their indexes/TOAST storage, occupy approximately 752 KiB. This excludes Supabase-managed schemas, uploaded objects and the rest of the database.

All five observed foreign keys are validated. Aggregate checks found zero orphans for views/reactions to projects, projects to categories, and accounts/sessions to users. No duplicate project/page/category slugs or subscriber emails were found. No invalid project/page statuses, invalid reaction kinds, blank reaction visitor IDs, reversed project/page timestamps, or project update timestamps more than one day ahead were counted. These checks describe the predicates tested; they are not a claim that every possible content/business rule was validated.

## Access-control findings

The audit user can select every inspected public table and cannot INSERT, UPDATE, DELETE or TRUNCATE them. RLS is not active for the auditor on these tables, so the aggregate counts are not silently reduced by row policies.

The `anon`, `authenticated` and `service_role` roles have no tested SELECT/INSERT/UPDATE/DELETE privileges on these public tables. Additional column-level checks found no read/write exceptions for anon/authenticated. No explicit default-privilege records were found in public or the database-wide default scope; this does not mean future objects have no PostgreSQL default permissions. All inspected tables are owned by `postgres`.

The absence of grants matters: RLS being off is not, by itself, proof of anonymous access. Supabase checks grants and row policies together. A later grant on an exposed, non-RLS table could change this posture. No direct HTTP Data API test or hosting-secret inspection was performed. [Supabase access-control guidance](https://supabase.com/docs/guides/database/postgres/row-level-security)

Storage `buckets` and `objects` have RLS enabled. The auditor lacks storage schema usage/table SELECT; no storage policies were found in the catalog query, but bucket public flags, object access and real upload behavior remain unverified. No access to Supabase `auth` records was requested.

Credential rotation is not established by successfully connecting with the new audit role. The old application credential was not tested or reused.

## Performance observations

Plain EXPLAIN produced these estimated plans; none of the underlying SELECTs was executed by EXPLAIN:

| Query | Observed plan | Interpretation |
| --- | --- | --- |
| Public project listing | Sequential scan, sort, limit; estimated 3 rows | Appropriate candidate plan for a three-row table; not evidence that another index is required |
| Recent views within the audit's 30-day date range | Backward scan of ProjectView_createdAt_idx with incremental sort | Existing date index supports the query |
| Date-filtered contact-click aggregation | Sequential scan, sorts, grouped aggregate | Only eight stored rows; the planned date index is a growth aid, not a measured latency fix |

The three absent repository indexes support category relation checks, date-filtered clicks and date-filtered reactions. Each adds storage and write maintenance. No latency improvement was measured. Existing project slug, session token and view-date indexes have nonzero usage counters. Some indexes have zero scans; that alone is insufficient evidence to drop them because workload and observation windows matter.

Database-wide statistics show zero recorded deadlocks and about 6.4 GiB of cumulative temporary-file bytes since the reported reset on 2025-11-15. Those totals include non-application workloads and do not identify a current slow query. Other-session details and pg_stat_statements access are restricted, so no reliable slow-query attribution was made. PostgreSQL statistics are cumulative and can be delayed; estimated dead tuples are not a direct bloat measurement. [PostgreSQL statistics reference](https://www.postgresql.org/docs/17/monitoring-stats.html)

No VACUUM, ANALYZE, index creation, statistics reset, maintenance job or query cancellation was performed.

## Deliverables and remaining limits

- [Repeatable read-only runner](../scripts/audit-db.mjs): `node scripts/audit-db.mjs`; requires psql and the separately configured ignored audit environment file.
- [Sanitized catalog/aggregate evidence](live-database-audit-2026-10-05.json).
- [Physical reconciliation SQL for review](sql/live-schema-reconciliation-review.sql), not applied.
- [Deployment, backup and rollback runbook](deployment-runbook.md).

The production audit completed within the available permissions. Backup restoration, real OAuth/storage testing, production Data API reachability, detailed slow-query review, and production reconciliation remain separate work. No elevated permissions were requested to bypass those limits.

Follow-up: after the owner granted SELECT on eight ID sequences, the [real-snapshot reconciliation rehearsal](db-reconciliation-rehearsal-2026-10-05.md), encrypted retained backup and independent restore passed. The owner then explicitly approved production reconciliation. It completed with zero schema drift, four matching migrations, valid indexes and unchanged existing records/sequences/grants/RLS. See the [production record and recovery copies](production-db-reconciliation-2026-10-05.md). Temporary resources were removed.
