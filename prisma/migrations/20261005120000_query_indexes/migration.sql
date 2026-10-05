-- Support category relation checks, date-filtered click analytics and reaction activity.
-- Apply only after the existing production schema has been reconciled.
CREATE INDEX "Project_categoryId_idx" ON "Project"("categoryId");
CREATE INDEX "ContactClick_createdAt_idx" ON "ContactClick"("createdAt");
CREATE INDEX "ProjectReaction_updatedAt_idx" ON "ProjectReaction"("updatedAt");
