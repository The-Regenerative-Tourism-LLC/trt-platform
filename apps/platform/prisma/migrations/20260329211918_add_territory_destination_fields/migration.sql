-- Migration: add_territory_destination_fields
--
-- Adds destination presentation and availability fields to the territories table.
-- These fields separate the DPI measurement model (already correct) from the
-- destination product model needed for the public listing and onboarding flow.
--
-- New fields:
--   slug          — URL-safe unique identifier for /destinations/:slug routing
--   isAvailable   — controls visibility: true = live, false = coming soon
--   description   — marketing description for the destination card and page
--   coverPhotoUrl — header image URL
--   displayOrder  — controls listing order (lower = first)
--   countryCode   — ISO 3166-1 alpha-3 code, used by DPI orchestrator directly
--                   instead of fragile string-matching on territory name/country

ALTER TABLE "territories"
  ADD COLUMN "slug"          TEXT,
  ADD COLUMN "isAvailable"   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "description"   TEXT,
  ADD COLUMN "coverPhotoUrl" TEXT,
  ADD COLUMN "displayOrder"  INTEGER NOT NULL DEFAULT 999,
  ADD COLUMN "countryCode"   TEXT;

-- Unique index on slug — nullable (NULL != NULL in SQL, so multiple NULLs are allowed)
-- but once set, slugs must be globally unique across all territories.
CREATE UNIQUE INDEX "territories_slug_key" ON "territories"("slug");
