-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('email_verification', 'password_reset', 'password_changed', 'welcome', 'invitation', 'new_login_alert', 'onboarding_completed', 'assessment_submitted', 'evidence_uploaded', 'evidence_approved', 'evidence_rejected', 'score_updated', 'report_ready', 'reminder_incomplete_onboarding', 'reminder_missing_evidence', 'reminder_forward_commitment', 'weekly_summary', 'monthly_report', 'partner_invitation', 'admin_new_operator_registered', 'admin_assessment_submitted', 'admin_evidence_requires_review', 'admin_system_error');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('pending', 'sent', 'failed', 'bounced');

-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('email_verification', 'password_reset', 'invitation', 'partner_invitation');

-- CreateTable
CREATE TABLE "secure_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "secure_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "type" "EmailType" NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'pending',
    "provider" TEXT NOT NULL DEFAULT 'resend',
    "providerId" TEXT,
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assessmentUpdates" BOOLEAN NOT NULL DEFAULT true,
    "evidenceUpdates" BOOLEAN NOT NULL DEFAULT true,
    "scoreUpdates" BOOLEAN NOT NULL DEFAULT true,
    "reportReady" BOOLEAN NOT NULL DEFAULT true,
    "onboardingReminders" BOOLEAN NOT NULL DEFAULT true,
    "evidenceReminders" BOOLEAN NOT NULL DEFAULT true,
    "commitmentReminders" BOOLEAN NOT NULL DEFAULT true,
    "weeklySummary" BOOLEAN NOT NULL DEFAULT true,
    "monthlyReport" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "secure_tokens_tokenHash_key" ON "secure_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "secure_tokens_tokenHash_idx" ON "secure_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "secure_tokens_email_type_idx" ON "secure_tokens"("email", "type");

-- CreateIndex
CREATE INDEX "email_logs_userId_idx" ON "email_logs"("userId");

-- CreateIndex
CREATE INDEX "email_logs_email_idx" ON "email_logs"("email");

-- CreateIndex
CREATE INDEX "email_logs_type_idx" ON "email_logs"("type");

-- CreateIndex
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- AddForeignKey
ALTER TABLE "secure_tokens" ADD CONSTRAINT "secure_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
