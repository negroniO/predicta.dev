# Production database reconciliation — completed

**Completed with explicit owner approval on 2026-10-05, 20:21:02–20:22:01 Asia/Nicosia (UTC+03:00).** The nullable legacy column and three indexes were added, and both pending migrations were recorded after their complete schema state was verified. No application rows were modified. Application deployment and destructive recovery remain outside this change.

## Production results

The [execution evidence](production-db-reconciliation-result-2026-10-05.json) records:

- `Project.category` is present, nullable, and compatible with the generated client's `legacyCategory` field.
- `Project_categoryId_idx`, `ContactClick_createdAt_idx` and `ProjectReaction_updatedAt_idx` are present, valid and ready.
- All four migration names/checksums match the unchanged repository SQL. The original two migration-history records checked by the runner were preserved.
- Prisma's final schema diff is empty; migration status succeeds; ordinary `migrate deploy` reports no pending work.
- All 235 existing application records across 12 tables retained their original field values, and all eight sequence values were unchanged across the operation. Aggregate checks found no orphan relationships.
- Tested table grants, table ownership and RLS settings were unchanged. Generated-client project/page/relation reads passed inside explicit read-only transactions; no production write smoke tests were performed.
- Temporary reference database/network cleanup completed.

The [one-time execution script](../scripts/apply-db-reconciliation.mjs) now refuses a repeat run when successful execution evidence exists. Do not delete the result to bypass this guard.

The preflight found that this pooled connection ignored PostgreSQL startup `options`: it retained a zero lock timeout and a two-minute statement timeout. Explicit SQL transaction settings worked. Consequently, the original index SQL was executed inside a transaction with a two-second lock timeout and a 30-second statement timeout, then its full schema state was verified before `migrate resolve --applied` recorded it. A normal deploy subsequently confirmed there was no pending migration. This adjusted the execution mechanism, not the approved SQL, schema changes or migration checksums. Both the column change and index transaction had explicit timeout limits; Prisma metadata commands retained their normal connection behavior. Supabase documents session/transaction configuration separately from role defaults. [Supabase timeout guidance](https://supabase.com/docs/guides/database/postgres/timeouts)

## Recovery evidence

Latest pre-change backup ID: `23c29ee3-b4f0-487f-8da2-d358821c29e0`. The earlier independently restored backup `bc11abb4-8b22-448f-8ebb-9d6f1f026f12` is also retained.

- Captured on 2026-10-05 at approximately 20:12:25 Asia/Nicosia (UTC+03:00), using the restricted audit connection and PostgreSQL 17 pg_dump. It was decrypted, restored and reconciled locally before the live changes.
- Encrypted archive: `.local-backups/23c29ee3-b4f0-487f-8da2-d358821c29e0.json`.
- Recovery key: `.env.recovery-key.local`. Keep this file; losing it makes the archive unusable. Its value must not be pasted into chat, logs or source control.
- Archive and key are Git-ignored, restricted to the local user, and stored separately. The archive is encrypted with AES-256-GCM using a random 256-bit key and a fresh nonce. Authentication is checked before decrypted content is returned. [Node.js crypto reference](https://nodejs.org/docs/latest-v22.x/api/crypto.html)
- Original archive size: 44,498 bytes. SHA-256: `b5ecfadf8240ff72820d2ec41d889ac23387d840ef837eb895b787498274214a`.
- [Retained-backup rehearsal](db-reconciliation-retained-2026-10-05.json) reloaded the encrypted file, checked the decrypted checksum, restored it, and passed the full reconciliation.
- [Independent recovery run](db-reconciliation-restore-2026-10-05.json) tested the earlier `bc11abb4` archive in a new process without connecting to production. It restored PostgreSQL 17.6 and passed the same checks. Both that run and the refreshed pre-change backup rehearsal preserved all 235 original records and sequence values, and removed their temporary databases/networks.

This backup contains public-schema definitions, table data, sequence values and migration history. It excludes ownership, ACLs, Supabase-managed schemas and uploaded object bytes. It is a local application recovery copy, not a full-project or off-machine disaster-recovery backup. The key remains on this machine too. Retain a separate protected copy of the archive and key through your chosen backup/password-management process; this work has not uploaded them anywhere. Recovery of a running service would also require reviewed role/grant and storage configuration.

To repeat the independent restore on this machine:

```sh
node scripts/rehearse-db-reconciliation.mjs --restore-backup 23c29ee3-b4f0-487f-8da2-d358821c29e0
```

Each retained backup has a unique ID and is never overwritten. The generated evidence file describes the latest run; retain its ID/checksum with the release record. The restore command exercises the historical reconciliation on a disposable copy; it does not restore over production or leave a recovery service running. The live-export rehearsal is specific to the old four-difference state and must not be rerun against the now-reconciled database as a generic backup command. Use a separately reviewed general backup process for future snapshots.

## Reviewed sequence and execution adjustment

The target was the hosted database inspected using `.env.audit.local`. URL identity checks and read-only TLS connections verified that `.env`'s owner connection reached the same database as the audit role. The configured owner credential was then used only for the approved DDL/migration-history writes and read verification. Successful authentication does not establish credential rotation.

Before any write, the operator must confirm the approved target using a read-only connection, verify the backup can still decrypt, and recheck schema/history against the dated evidence. Compare the current source checksums with `sourceSha256` in the retained/restore results. If the source, target, migration checksums, category state or four expected physical differences have changed, stop and update the proposal. Use an explicitly selected owner/migration connection over TLS, injected into an isolated working directory; do not let Prisma discover `.env` implicitly.

1. Execute [production-legacy-column.sql](sql/production-legacy-column.sql). It adds only `public."Project"."category" TEXT`, nullable and without a default. It uses a transaction, a two-second lock timeout and a 30-second statement timeout. It refuses unexpected migration/category state and fails if the column already exists. Existing project/category values are not rewritten; missing historical category text cannot be reconstructed.
2. Compare the resulting full schema to a clean reference database containing exactly the first three repository migrations. Verify no nonblank legacy text is waiting for category backfill. Only if both checks match, run Prisma 6.19 `migrate resolve --applied 20261003120000_reconcile_application_models` against the approved target. This writes the migration-history record; it does not rerun the already-existing table/relation creation or its backfill.
3. Run Prisma 6.19 `migrate deploy` with the four reviewed migrations. Only `20261005120000_query_indexes` should be pending. It creates:
   - `Project_categoryId_idx` on `Project(categoryId)`.
   - `ContactClick_createdAt_idx` on `ContactClick(createdAt)`.
   - `ProjectReaction_updatedAt_idx` on `ProjectReaction(updatedAt)`.
4. Verify migration status, an empty diff against `prisma/schema.prisma`, the four matching checksums, valid indexes and unchanged application relationships. Read representative content through the current generated client without publishing rows in logs. Record pre/post counts, allowing for legitimate concurrent live activity; exact row equality during the isolated rehearsal does not justify assuming the live site has stopped receiving writes.

The restored copies used the sequence above. Production substituted a bounded SQL transaction plus verified history resolution for step 3 because startup timeout options were ignored; the result is recorded above. No migration SQL was edited. Do not rerun the legacy-column SQL or manually recreate these indexes. Do not use `db push`, reset, or mark a failed/unverified migration applied. Prisma's resolution command is appropriate only after the intended state has been established. [Prisma v6 hotfix guidance](https://www.prisma.io/docs/orm/v6/prisma-migrate/workflows/patching-and-hotfixing)

## Operational limits and recovery decision

The nullable-column change takes a table lock; normal index creation can temporarily block writes. The inspected tables are small, but the local rehearsal does not measure production contention. Use a short maintenance window and an operator ready to cancel a waiting index migration. The legacy-column SQL bounds its own waits; the existing index migration has no explicit lock timeout. Recheck status after any cancellation before retrying.

If the column transaction fails, it rolls back. If later equivalence checks fail, stop with the additive column in place and inspect the difference. If history resolution or index deployment fails, retain the actual partial state and Prisma diagnostics privately; repair forward only after comparing the schema. Do not remove existing content, drop the new column/indexes automatically, or overwrite the live database to undo an additive change.

For data recovery, restore this backup into a new isolated database, preserve any newer live writes, reconcile roles/grants, validate data and storage dependencies, then propose an explicit recovery/cutover. Restoring the snapshot can lose changes after its capture time. No destructive production restore is authorized by approval of the additive reconciliation.

Real OAuth/storage staging tests, credential rotation verification, provider backup coverage and application deployment checks remain in the [deployment runbook](deployment-runbook.md). The owner's approval was limited to the nullable column, verified migration-history resolution and three indexes on the confirmed database; those changes are complete.
