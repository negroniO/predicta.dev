-- PRODUCTION CHANGE CANDIDATE: run only after the target, backup and writes are approved.
-- Rehearsed by scripts/rehearse-db-reconciliation.mjs on isolated PostgreSQL.
-- Adds compatibility only; does not recover removed historical category values.
-- Resolve migration history only after a full schema equivalence check.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';
SET LOCAL search_path = public, pg_catalog;

DO $preflight$
BEGIN
  IF (SELECT count(*) FROM public."_prisma_migrations") <> 2
    OR EXISTS (
      SELECT 1 FROM public."_prisma_migrations"
      WHERE migration_name NOT IN ('20251125153248_init', '20251125190038_add_newsletter_testimonials')
        OR finished_at IS NULL OR rolled_back_at IS NOT NULL
    ) THEN
    RAISE EXCEPTION 'Migration history changed; stop and review';
  END IF;
  IF EXISTS (SELECT 1 FROM public."Category")
    OR EXISTS (SELECT 1 FROM public."Project" WHERE "categoryId" IS NOT NULL) THEN
    RAISE EXCEPTION 'Category state changed; stop and review';
  END IF;
END
$preflight$;

ALTER TABLE public."Project" ADD COLUMN "category" TEXT;
COMMIT;
