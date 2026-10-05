-- Applies to the committed historical migrations. An existing database created
-- using db push must be inspected/baselined before deploying this migration.
BEGIN;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "categoryId" INTEGER;

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactClick" (
    "id" SERIAL NOT NULL,
    "href" TEXT NOT NULL,
    "referrer" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectReaction" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");

-- CreateIndex
CREATE INDEX "ProjectReaction_projectId_idx" ON "ProjectReaction"("projectId");

-- CreateIndex
CREATE INDEX "ProjectReaction_visitorId_idx" ON "ProjectReaction"("visitorId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectReaction_projectId_visitorId_key" ON "ProjectReaction"("projectId", "visitorId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectReaction" ADD CONSTRAINT "ProjectReaction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve the original text and copy nonblank categories into the relation.
-- Hashes provide deterministic slugs even for punctuation/non-Latin names.
INSERT INTO "Category" ("name", "slug")
SELECT MIN(TRIM("category")), 'legacy-' || MD5(LOWER(TRIM("category")))
FROM "Project"
WHERE NULLIF(TRIM("category"), '') IS NOT NULL
GROUP BY LOWER(TRIM("category"));

UPDATE "Project" AS p
SET "categoryId" = c."id"
FROM "Category" AS c
WHERE c."slug" = 'legacy-' || MD5(LOWER(TRIM(p."category")))
  AND p."categoryId" IS NULL;

COMMIT;
