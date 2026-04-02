#!/bin/sh
# ── TRT Platform — production entrypoint ──────────────────────────────────────
#
# Executed by the runner container on every startup.
#
# Flow:
#   1. Wait for PostgreSQL to accept connections (retry loop — no extra tools)
#   2. Apply pending Prisma migrations (idempotent, advisory-locked)
#   3. exec into the Next.js standalone server (PID 1 from this point, clean signals)
#
# Environment variables expected at runtime (injected by Railway):
#   DATABASE_URL   — PostgreSQL connection string
#   AUTH_SECRET    — Auth.js signing secret
#   PORT           — TCP port (Railway injects this; Next.js reads it automatically)
#   HOSTNAME       — bind address (set to 0.0.0.0 in Dockerfile ENV)
#
# MONOREPO NOTE:
#   Next.js standalone output preserves the workspace directory structure.
#   The app lives at apps/platform/ in the monorepo, so server.js is emitted
#   at .next/standalone/apps/platform/server.js — NOT at the standalone root.
#   All paths below reflect this structure.

set -e

MAX_RETRIES=30   # max attempts  (~60 s window at 2 s intervals)
RETRY_INTERVAL=2 # seconds between retries

# ── 1. Wait for the database ───────────────────────────────────────────────────
# Retry `prisma migrate deploy` until it succeeds or we hit the limit.
# Prisma exits non-zero with P1001 when the database is unreachable, which
# is exactly the signal we need — no extra tooling (pg_isready, nc) required.

echo "==> Waiting for database..."
retries=0
until npx prisma migrate deploy; do
  retries=$((retries + 1))
  if [ "$retries" -ge "$MAX_RETRIES" ]; then
    echo "ERROR: Database still unreachable after $((MAX_RETRIES * RETRY_INTERVAL))s. Aborting."
    exit 1
  fi
  echo "    Not ready yet — retry $retries/$MAX_RETRIES (next attempt in ${RETRY_INTERVAL}s)"
  sleep "$RETRY_INTERVAL"
done

echo "==> Migrations applied."

# ── 2. Start Next.js standalone server ────────────────────────────────────────
# `exec` replaces this shell process so the server becomes PID 1, ensuring
# Railway's SIGTERM on deploy triggers a clean graceful shutdown.
# PORT and HOSTNAME are read from the environment (set in Dockerfile + Railway).
#
# server.js is at apps/platform/server.js inside the container because the
# standalone output mirrors the monorepo workspace path.
echo "==> Starting server on ${HOSTNAME:-0.0.0.0}:${PORT:-3000}..."
exec node apps/platform/server.js
