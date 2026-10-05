# Database reconciliation rehearsal — 2026-10-05

**The real-snapshot rehearsal passed, and the later approved production reconciliation is complete.** This document records the earlier isolated rehearsal. After the owner added the sequence-read grants, the audit connection verified TLS, read-only transactions, no elevated role flags, and access to all application tables and sequences. The rehearsal runner reconciled only a disposable local restore. See the separate [production execution record](production-db-reconciliation-2026-10-05.md) for the authorized live changes.

## Verified result

The run completed on 2026-10-05, from 19:27:37 to 19:28:01 Asia/Nicosia (UTC+03:00). The [sanitized evidence](db-reconciliation-rehearsal-2026-10-05.json) records a successful 44,498-byte application snapshot, PostgreSQL 17.6 restore, all verification stages and successful container/network removal.

- All 235 original records across 12 application tables retained the same original field values, including relationship IDs.
- All eight sequence values and `is_called` flags were unchanged by reconciliation. The final disposable write smoke test ran afterward.
- The review SQL rolled back cleanly. The committed local repair added the missing nullable legacy column, resolved the third migration after full schema equivalence, and applied the index migration normally.
- The final schema comparison reported no differences; all four migration checksums matched their repository files, and the second migration deploy made no changes.
- Generated-client scalar/relation reads, draft creation/update/deletion and reaction/view cascades passed. Original restored records remained unchanged after the rolled-back smoke test.
- The temporary database, Docker network and working directory were removed. No persistent snapshot or recovery backup was retained.

Subsequent recovery preparation retained a new encrypted snapshot and verified it in an independent restore process. See the [production change candidate and recovery record](production-db-reconciliation-2026-10-05.md). The statement above describes the original rehearsal, which did not retain its snapshot.

## Export access

The owner applied [audit-sequence-read-access.sql](sql/audit-sequence-read-access.sql). Reapplying it is not needed for this completed run. It grants only SELECT on eight explicitly named application sequences to the existing audit role, without sequence USAGE/UPDATE, table writes, schema creation or administrator privileges. PostgreSQL distinguishes sequence read permission from permissions to advance or set a sequence. [PostgreSQL privilege reference](https://www.postgresql.org/docs/17/ddl-priv.html)

Keep using the restricted audit connection for repeat exports; do not substitute the administrator connection in `.env`. The runner does not revoke the owner's grants after completion.

## Runner and isolation

The [rehearsal runner](../scripts/rehearse-db-reconciliation.mjs) requires Node 22, the installed repository dependencies, psql, Docker, and the local `public.ecr.aws/supabase/postgres:17.6.1.063` image. Run from the repository root. The live-export commands below describe the historical pre-change workflow; they now refuse execution because production reconciliation is complete. Fixture and retained-backup modes remain available.

```sh
# Real snapshot; reads only AUDIT_DATABASE_URL in .env.audit.local.
node scripts/rehearse-db-reconciliation.mjs

# Independent synthetic test; does not read any production environment file.
node scripts/rehearse-db-reconciliation.mjs --fixture-only

# Retain an encrypted snapshot and rehearse after loading it back from disk.
node scripts/rehearse-db-reconciliation.mjs --retain-backup

# Restore a retained snapshot without connecting to production.
node scripts/rehearse-db-reconciliation.mjs --restore-backup BACKUP_ID
```

The real mode first verifies role, TLS, read-only settings, table/sequence visibility and absence of public functions/triggers. It refuses to continue on unexpected conditions. PostgreSQL 17 pg_dump exports the public schema, table data and sequence values through a read-only connection with timeouts. Ownership and ACLs are excluded because the target has isolated local roles. A schema-limited dump is an application snapshot, not a full Supabase project backup. [PostgreSQL pg_dump reference](https://www.postgresql.org/docs/17/app-pgdump.html)

The unencrypted custom archive stays in process memory; restored database files use container tmpfs. With `--retain-backup`, an encrypted copy is saved under the ignored `.local-backups` directory and authenticated decryption is checked before restoration. The key is generated once in ignored `.env.recovery-key.local`; both files must be retained for future recovery. Passwords are passed to the export process through stdin, not Docker configuration or command arguments. Local connections use a random password and a loopback-only published port on a dedicated Docker bridge with masquerading disabled. No application server, OAuth provider, storage integration or background job is started.

Prisma runs from a temporary directory with a copied schema/migration directory and an explicit local target, so it cannot discover the repository's `.env`. Database writes are limited to the disposable container. The runner removes its container, network and temporary working files in a finally block; cleanup results are saved. If execution is forcibly interrupted, inspect leftover resources named `predicta-rehearsal-*` before retrying. Retained encrypted archives and their key deliberately survive cleanup; the default and fixture modes do not save backups.

## Sequence under test

1. Restore the snapshot and verify that the two recorded migrations are finished, not rolled back, and match repository checksums.
2. Require the exact four physical differences found in the live audit. Any additional drift stops the run.
3. Execute the existing review SQL, which ends in ROLLBACK. Verify the schema, original field values and sequence values remain unchanged.
4. Add only the missing nullable `Project.category` column on the local copy.
5. Build a separate empty reference database from the first three repository migrations. Compare the restored database against that entire schema, and verify there is no outstanding legacy category backfill.
6. Mark `20261003120000_reconcile_application_models` as applied **only on the local copy**, after equivalence is established.
7. Let ordinary `migrate deploy` execute `20261005120000_query_indexes`. Do not pre-create those indexes with a separate committed copy of the review SQL.
8. Require an empty final schema diff, successful migration status, all four matching migration checksums, and an unchanged history on a second deploy.
9. Compare every original application field across all 12 tables, including relationship IDs, and every sequence's `last_value`/`is_called`. Fingerprints are computed locally and not retained in published evidence.
10. Use the installed generated Prisma client to read projects, categories, reactions, pages, users/accounts/sessions, and analytics counts. Exercise local draft creation/update/deletion and reaction/view cascades in a rolled-back transaction. Recheck original data afterward. Sequence increments from this final local smoke test are expected and occur after preservation checks.

This follows Prisma's hotfix reconciliation approach: establish the intended state before resolving migration history. Adding a nullable column cannot recover historical category values that may previously have been removed. [Prisma v6 hotfix guidance](https://www.prisma.io/docs/orm/v6/prisma-migrate/workflows/patching-and-hotfixing)

## Evidence and limits

- [Synthetic fixture results](db-reconciliation-fixture-2026-10-05.json): the isolated test reconstructs the audited drift with invented content and authentication records. It is not evidence about live-row preservation.
- [Real-snapshot rehearsal results](db-reconciliation-rehearsal-2026-10-05.json): export access, snapshot identity, actual restore, reconciliation, preservation checks, generated-client smoke tests and cleanup all passed.
- [Original live audit](live-database-audit-2026-10-05.md): catalog, aggregate integrity and access-control findings.

The fixture validates the narrow sequence grant, actual dump/restore, rollback behavior, full migration-state comparison, history reconciliation, ordinary deployment, data/sequence preservation, and generated-client operations. Its public data intentionally includes an uppercase slug and an expired session; neither is silently cleaned up by reconciliation.

The application database rehearsal against real data is complete. It does not verify a provider backup/PITR restore, Supabase-managed schemas, production grants after restoration, uploaded object bytes, real OAuth or uploads, full application HTTP/browser behavior against restored data, or production write-lock duration. Those remain release checks in the [deployment runbook](deployment-runbook.md). The subsequently approved [production reconciliation](production-db-reconciliation-2026-10-05.md) resolved the schema/migration drift and verified unchanged existing data, sequences, grants and RLS settings.
