-- REVIEW ONLY: generated from the read-only live audit on 2026-10-05.
-- NOT a repository migration and NOT applied to production.
-- Recheck current drift and rehearse on a restored isolated copy first.
-- Does not reconcile _prisma_migrations, restore lost legacy values, or rename slugs.
-- Intentionally rolls back by default; committing requires a reviewed release step.
-- Do not execute using the audit account or against an unverified target.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '30s';
SET LOCAL search_path = public, pg_catalog;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "category" TEXT;

-- CreateIndex
CREATE INDEX "ContactClick_createdAt_idx" ON "ContactClick"("createdAt");

-- CreateIndex
CREATE INDEX "Project_categoryId_idx" ON "Project"("categoryId");

-- CreateIndex
CREATE INDEX "ProjectReaction_updatedAt_idx" ON "ProjectReaction"("updatedAt");


ROLLBACK; -- Deliberate: review/dry run only.
