-- Migration: add_platform_entities
-- Adds public operator profile fields, new enums, and platform entity models
-- for biodiversity missions, activities, traveler gamification, and notifications.

-- ── New Enums ────────────────────────────────────────────────────────────────

-- CreateEnum
CREATE TYPE "ActivityDifficulty" AS ENUM ('easy', 'moderate', 'challenging');

-- CreateEnum
CREATE TYPE "BadgeType" AS ENUM (
  'first_checkin', 'first_encounter', 'levada_explorer', 'eel_guardian',
  'marine_guardian', 'forest_guardian', 'soil_guardian', 'culture_keeper',
  'community_builder', 'regenerator'
);

-- CreateEnum
CREATE TYPE "SightingStatus" AS ENUM ('pending', 'confirmed', 'rejected');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM (
  'score_published', 'evidence_verified', 'evidence_rejected',
  'booking_confirmed', 'trip_completed', 'badge_earned', 'mission_update', 'system'
);

-- ── Operator: public profile fields ──────────────────────────────────────────

ALTER TABLE "operators"
  ADD COLUMN "tagline" TEXT,
  ADD COLUMN "description" TEXT,
  ADD COLUMN "coverPhotoUrl" TEXT,
  ADD COLUMN "photos" TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN "amenities" TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN "address" TEXT,
  ADD COLUMN "lat" DECIMAL(10, 7),
  ADD COLUMN "lng" DECIMAL(10, 7),
  ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "publicationBlockedReason" TEXT,
  ADD COLUMN "qrCodeUrl" TEXT;

-- ── DpiSnapshot: methodology version ─────────────────────────────────────────

ALTER TABLE "dpi_snapshots"
  ADD COLUMN "methodologyVersion" TEXT NOT NULL DEFAULT '1.0.0';

-- ── Traveler: gamification fields ─────────────────────────────────────────────

ALTER TABLE "travelers"
  ADD COLUMN "level" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "points" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "publicSlug" TEXT,
  ADD COLUMN "avatarUrl" TEXT;

-- CreateIndex for traveler publicSlug
CREATE UNIQUE INDEX "travelers_publicSlug_key" ON "travelers"("publicSlug");

-- ── CheckIn ───────────────────────────────────────────────────────────────────

CREATE TABLE "check_ins" (
    "id" TEXT NOT NULL,
    "travelerId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "lat" DECIMAL(10,7),
    "lng" DECIMAL(10,7),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "check_ins_pkey" PRIMARY KEY ("id")
);

-- ── Activity ──────────────────────────────────────────────────────────────────

CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "difficulty" "ActivityDifficulty" NOT NULL DEFAULT 'moderate',
    "durationMinutes" INTEGER,
    "maxParticipants" INTEGER,
    "pointsOnComplete" INTEGER NOT NULL DEFAULT 0,
    "photoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- ── ActivityRegistration ───────────────────────────────────────────────────────

CREATE TABLE "activity_registrations" (
    "id" TEXT NOT NULL,
    "travelerId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'registered',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_registrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "activity_registrations_travelerId_activityId_key"
  ON "activity_registrations"("travelerId", "activityId");

-- ── BiodiversityMission ────────────────────────────────────────────────────────

CREATE TABLE "biodiversity_missions" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "species" TEXT,
    "speciesScientific" TEXT,
    "category" TEXT,
    "difficulty" "ActivityDifficulty" NOT NULL DEFAULT 'easy',
    "pointsPerSighting" INTEGER NOT NULL DEFAULT 10,
    "pointsPerExploration" INTEGER NOT NULL DEFAULT 5,
    "photoUrl" TEXT,
    "coverPhotoUrl" TEXT,
    "isNightWindow" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "territoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "biodiversity_missions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "biodiversity_missions_slug_key" ON "biodiversity_missions"("slug");

-- ── MissionSighting ────────────────────────────────────────────────────────────

CREATE TABLE "mission_sightings" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "travelerId" TEXT NOT NULL,
    "photoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "lat" DECIMAL(10,7),
    "lng" DECIMAL(10,7),
    "waterBodyName" TEXT,
    "depth" DECIMAL(6,2),
    "behavior" TEXT,
    "notes" TEXT,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "status" "SightingStatus" NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_sightings_pkey" PRIMARY KEY ("id")
);

-- ── MissionExploration ─────────────────────────────────────────────────────────

CREATE TABLE "mission_explorations" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "travelerId" TEXT NOT NULL,
    "lat" DECIMAL(10,7),
    "lng" DECIMAL(10,7),
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_explorations_pkey" PRIMARY KEY ("id")
);

-- ── TravelerBadge ──────────────────────────────────────────────────────────────

CREATE TABLE "traveler_badges" (
    "id" TEXT NOT NULL,
    "travelerId" TEXT NOT NULL,
    "badge" "BadgeType" NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "traveler_badges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "traveler_badges_travelerId_badge_key"
  ON "traveler_badges"("travelerId", "badge");

-- ── OperatorReview ─────────────────────────────────────────────────────────────

CREATE TABLE "operator_reviews" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "travelerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operator_reviews_pkey" PRIMARY KEY ("id")
);

-- ── Notification ────────────────────────────────────────────────────────────────

CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "travelerId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- ── ProfileView ─────────────────────────────────────────────────────────────────

CREATE TABLE "profile_views" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referrer" TEXT,
    "country" TEXT,

    CONSTRAINT "profile_views_pkey" PRIMARY KEY ("id")
);

-- ── TravelerWaitlist ────────────────────────────────────────────────────────────

CREATE TABLE "traveler_waitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "traveler_waitlist_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "traveler_waitlist_email_key" ON "traveler_waitlist"("email");

-- ── Foreign Keys ────────────────────────────────────────────────────────────────

ALTER TABLE "check_ins"
  ADD CONSTRAINT "check_ins_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "travelers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "check_ins_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "activities"
  ADD CONSTRAINT "activities_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "activity_registrations"
  ADD CONSTRAINT "activity_registrations_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "travelers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "activity_registrations_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mission_sightings"
  ADD CONSTRAINT "mission_sightings_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "biodiversity_missions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "mission_sightings_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "travelers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mission_explorations"
  ADD CONSTRAINT "mission_explorations_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "biodiversity_missions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "mission_explorations_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "travelers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "traveler_badges"
  ADD CONSTRAINT "traveler_badges_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "travelers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "operator_reviews"
  ADD CONSTRAINT "operator_reviews_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "operator_reviews_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "travelers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "travelers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "profile_views"
  ADD CONSTRAINT "profile_views_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
