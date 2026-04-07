-- AlterTable: add dpiTerritoryId and referenceDpi to score_snapshots
-- dpiTerritoryId: territory whose DPI was actually used in scoring (may differ from operator territory)
-- referenceDpi: true when DPI used is not the operator's own territory DPI (e.g. Madeira as reference)
ALTER TABLE "score_snapshots" ADD COLUMN "dpiTerritoryId" TEXT;
ALTER TABLE "score_snapshots" ADD COLUMN "referenceDpi" BOOLEAN NOT NULL DEFAULT false;
