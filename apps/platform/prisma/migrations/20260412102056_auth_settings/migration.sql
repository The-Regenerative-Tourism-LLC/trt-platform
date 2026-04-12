-- AlterTable
ALTER TABLE "users" ADD COLUMN     "consentedAt" TIMESTAMP(3),
ADD COLUMN     "marketingEmailConsent" BOOLEAN NOT NULL DEFAULT false;
