-- Add unique constraints on storageKey to prevent duplicate registrations
-- under retry or concurrent upload scenarios.
-- Note: storageKey is nullable on evidence_refs (legacy rows without storageKey
-- remain valid — PostgreSQL treats NULLs as distinct for unique indexes).

-- CreateIndex
CREATE UNIQUE INDEX "evidence_refs_storageKey_key" ON "evidence_refs"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "operator_photos_storageKey_key" ON "operator_photos"("storageKey");
