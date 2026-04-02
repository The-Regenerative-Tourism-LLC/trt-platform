-- AlterTable
ALTER TABLE "operators" ALTER COLUMN "experienceTypes" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "amenities" SET DEFAULT ARRAY[]::TEXT[];
