-- CreateEnum
CREATE TYPE "app_role" AS ENUM ('operator', 'traveler', 'admin', 'institution_partner');

-- CreateEnum
CREATE TYPE "OperatorType" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "P3Status" AS ENUM ('A', 'B', 'C', 'D', 'E');

-- CreateEnum
CREATE TYPE "PressureLevel" AS ENUM ('low', 'moderate', 'high');

-- CreateEnum
CREATE TYPE "GPSBand" AS ENUM ('regenerative_leader', 'regenerative_practice', 'advancing', 'developing', 'not_yet_published');

-- CreateEnum
CREATE TYPE "DPSBand" AS ENUM ('accelerating', 'progressing', 'stable', 'regressing', 'critical');

-- CreateEnum
CREATE TYPE "EvidenceTier" AS ENUM ('T1', 'T2', 'T3', 'Proxy');

-- CreateEnum
CREATE TYPE "VerificationState" AS ENUM ('pending', 'verified', 'rejected', 'lapsed');

-- CreateEnum
CREATE TYPE "ForwardCommitmentStatus" AS ENUM ('pending', 'matched', 'activated', 'lapsed');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('booked', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "app_role" NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "territories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "touristIntensity" DECIMAL(6,2),
    "ecologicalSensitivity" DECIMAL(6,2),
    "economicLeakageRate" DECIMAL(6,2),
    "regenerativePerformance" DECIMAL(6,2),
    "compositeDpi" DECIMAL(6,2),
    "pressureLevel" "PressureLevel",
    "operatorCohortSize" INTEGER NOT NULL DEFAULT 0,
    "dpiComputedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "territories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operators" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "legalName" TEXT NOT NULL,
    "tradingName" TEXT,
    "country" TEXT,
    "destinationRegion" TEXT,
    "territoryId" TEXT,
    "operatorType" "OperatorType",
    "operatorCode" TEXT,
    "yearOperationStart" INTEGER,
    "website" TEXT,
    "primaryContactName" TEXT,
    "primaryContactEmail" TEXT,
    "accommodationCategory" TEXT,
    "rooms" INTEGER,
    "bedCapacity" INTEGER,
    "experienceTypes" TEXT[],
    "ownershipType" TEXT,
    "localEquityPct" DECIMAL(5,2),
    "isChainMember" BOOLEAN NOT NULL DEFAULT false,
    "chainName" TEXT,
    "assessmentCycleCount" INTEGER NOT NULL DEFAULT 0,
    "onboardingData" JSONB NOT NULL DEFAULT '{}',
    "onboardingStep" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_snapshots" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "territoryId" TEXT NOT NULL,
    "assessmentCycle" INTEGER NOT NULL DEFAULT 1,
    "assessmentPeriodEnd" DATE NOT NULL,
    "operatorType" "OperatorType",
    "guestNights" DECIMAL(10,2),
    "visitorDays" DECIMAL(10,2),
    "revenueSplitAccommodationPct" DECIMAL(5,2),
    "revenueSplitExperiencePct" DECIMAL(5,2),
    "p1EnergyIntensity" DECIMAL(10,4),
    "p1RenewablePct" DECIMAL(5,2),
    "p1WaterIntensity" DECIMAL(10,4),
    "p1RecirculationScore" INTEGER,
    "p1WasteDiversionPct" DECIMAL(5,2),
    "p1CarbonIntensity" DECIMAL(10,4),
    "p1SiteScore" INTEGER,
    "p2LocalEmploymentRate" DECIMAL(5,2),
    "p2EmploymentQuality" DECIMAL(5,2),
    "p2LocalFbRate" DECIMAL(5,2),
    "p2LocalNonfbRate" DECIMAL(5,2),
    "p2DirectBookingRate" DECIMAL(5,2),
    "p2LocalOwnershipPct" DECIMAL(5,2),
    "p2CommunityScore" INTEGER,
    "p3Status" "P3Status",
    "p3CategoryScope" INTEGER,
    "p3Traceability" INTEGER,
    "p3Additionality" INTEGER,
    "p3Continuity" INTEGER,
    "p3ContributionCategories" TEXT[],
    "p3ProgrammeDescription" TEXT,
    "p3ProgrammeDuration" TEXT,
    "p3GeographicScope" TEXT,
    "p3AnnualBudget" DECIMAL(15,2),
    "p3GuestsParticipating" INTEGER,
    "p3IsCollective" BOOLEAN NOT NULL DEFAULT false,
    "p3CollectiveSize" TEXT,
    "p3CollectiveTotalBudget" DECIMAL(15,2),
    "p3CollectiveSharePct" DECIMAL(5,2),
    "p3InstitutionName" TEXT,
    "deltaPriorCycle" INTEGER,
    "deltaBaselineScores" JSONB,
    "deltaPriorScores" JSONB,
    "deltaCurrentScores" JSONB,
    "snapshotHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_refs" (
    "id" TEXT NOT NULL,
    "assessmentSnapshotId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "tier" "EvidenceTier",
    "fileName" TEXT,
    "storagePath" TEXT,
    "checksum" TEXT,
    "verificationState" "VerificationState" NOT NULL DEFAULT 'pending',
    "proxyMethod" TEXT,
    "proxyCorrectionFactor" DECIMAL(6,4),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,

    CONSTRAINT "evidence_refs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dpi_snapshots" (
    "id" TEXT NOT NULL,
    "territoryId" TEXT NOT NULL,
    "touristIntensity" DECIMAL(6,2) NOT NULL,
    "ecologicalSensitivity" DECIMAL(6,2) NOT NULL,
    "economicLeakageRate" DECIMAL(6,2) NOT NULL,
    "regenerativePerf" DECIMAL(6,2) NOT NULL,
    "compositeDpi" DECIMAL(6,2) NOT NULL,
    "pressureLevel" "PressureLevel" NOT NULL,
    "operatorCohortSize" INTEGER NOT NULL DEFAULT 0,
    "snapshotHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dpi_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "score_snapshots" (
    "id" TEXT NOT NULL,
    "assessmentSnapshotId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "dpiSnapshotId" TEXT,
    "methodologyVersion" TEXT NOT NULL DEFAULT '1.0.0',
    "inputHash" TEXT,
    "bundleHash" TEXT,
    "p1Score" DECIMAL(6,2) NOT NULL,
    "p2Score" DECIMAL(6,2) NOT NULL,
    "p3Score" DECIMAL(6,2) NOT NULL,
    "gpsTotal" DECIMAL(5,2) NOT NULL,
    "gpsBand" "GPSBand" NOT NULL,
    "dpsTotal" DECIMAL(6,2),
    "dps1" DECIMAL(6,2),
    "dps2" DECIMAL(6,2),
    "dps3" DECIMAL(6,2),
    "dpsBand" "DPSBand",
    "dpiScore" DECIMAL(6,2),
    "dpiPressureLevel" "PressureLevel",
    "computationTrace" JSONB,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publicationBlockedReason" TEXT,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "score_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forward_commitment_records" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "assessmentCycle" INTEGER NOT NULL,
    "preferredCategory" TEXT,
    "territoryContext" TEXT,
    "preferredInstitutionType" TEXT,
    "targetActivationCycle" INTEGER,
    "authorisedSignatory" TEXT,
    "status" "ForwardCommitmentStatus" NOT NULL DEFAULT 'pending',
    "matchedInstitution" TEXT,
    "activatedAt" TIMESTAMP(3),
    "lapsedAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "forward_commitment_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "methodology_bundles" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bundle" JSONB NOT NULL,
    "bundleHash" TEXT NOT NULL,
    "signature" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "methodology_bundles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "travelers" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "displayName" TEXT,
    "cumulativeChoiceScore" DECIMAL(6,2),
    "totalContributionEvents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "travelers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "travelerId" TEXT,
    "operatorId" TEXT NOT NULL,
    "scoreSnapshotId" TEXT,
    "dpiScoreAtBooking" DECIMAL(6,2),
    "checkIn" DATE,
    "checkOut" DATE,
    "nights" INTEGER,
    "status" "BookingStatus" NOT NULL DEFAULT 'booked',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_trip_reports" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "travelerId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "renewableKwhUsed" DECIMAL(10,4),
    "kwhVsRegionalAvg" DECIMAL(6,2),
    "localEconomyEur" DECIMAL(10,2),
    "contributionActivities" JSONB,
    "destinationDpi" DECIMAL(6,2),
    "pressureLevel" TEXT,
    "destinationNote" TEXT,
    "cumulativeChoiceScoreAtReport" DECIMAL(6,2),
    "totalContributionEventsAtReport" INTEGER,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_trip_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor" TEXT,
    "actorRole" "app_role",
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "payload" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_userId_role_key" ON "user_roles"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "operators_userId_key" ON "operators"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "operators_operatorCode_key" ON "operators"("operatorCode");

-- CreateIndex
CREATE UNIQUE INDEX "methodology_bundles_version_key" ON "methodology_bundles"("version");

-- CreateIndex
CREATE UNIQUE INDEX "travelers_userId_key" ON "travelers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "post_trip_reports_bookingId_key" ON "post_trip_reports"("bookingId");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operators" ADD CONSTRAINT "operators_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operators" ADD CONSTRAINT "operators_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "territories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_snapshots" ADD CONSTRAINT "assessment_snapshots_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_snapshots" ADD CONSTRAINT "assessment_snapshots_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "territories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_refs" ADD CONSTRAINT "evidence_refs_assessmentSnapshotId_fkey" FOREIGN KEY ("assessmentSnapshotId") REFERENCES "assessment_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_refs" ADD CONSTRAINT "evidence_refs_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dpi_snapshots" ADD CONSTRAINT "dpi_snapshots_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "territories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_snapshots" ADD CONSTRAINT "score_snapshots_assessmentSnapshotId_fkey" FOREIGN KEY ("assessmentSnapshotId") REFERENCES "assessment_snapshots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_snapshots" ADD CONSTRAINT "score_snapshots_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "score_snapshots" ADD CONSTRAINT "score_snapshots_dpiSnapshotId_fkey" FOREIGN KEY ("dpiSnapshotId") REFERENCES "dpi_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forward_commitment_records" ADD CONSTRAINT "forward_commitment_records_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travelers" ADD CONSTRAINT "travelers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "travelers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_scoreSnapshotId_fkey" FOREIGN KEY ("scoreSnapshotId") REFERENCES "score_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_trip_reports" ADD CONSTRAINT "post_trip_reports_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_trip_reports" ADD CONSTRAINT "post_trip_reports_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "travelers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
