#!/bin/sh
# ── TRT Platform — production entrypoint ──────────────────────────────────────
#
# Executed by the runner container on every startup.
#
# Flow:
#   1. Wait for PostgreSQL to accept connections (retry loop — no extra tools)
#   2. Apply pending Prisma migrations (idempotent, advisory-locked)
#   3. Regenerate Prisma client (precautionary; already done at build time)
#   4. exec into the Next.js production server (PID 1 from this point, clean signals)
#
# Environment variables expected at runtime (injected by Railway):
#   DATABASE_URL   — PostgreSQL connection string
#   AUTH_SECRET    — Auth.js signing secret
#   PORT           — TCP port (Railway injects this; Next.js reads it automatically)

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

# ── 2. Regenerate Prisma client ────────────────────────────────────────────────
# The client was already generated during `docker build` (for the Linux/musl
# target). This step is a precautionary re-run to ensure the runtime binary
# matches the schema. It is a no-op when nothing has changed.
echo "==> Generating Prisma client..."
npx prisma generate

# ── 3. Start Next.js ───────────────────────────────────────────────────────────
# `exec` replaces this shell process so Next.js becomes the direct signal
# recipient (SIGTERM on Railway deploys triggers a clean graceful shutdown).
# -H 0.0.0.0 binds to all interfaces (required in container environments).
# PORT is read automatically by Next.js from the environment.
echo "==> Starting Next.js on 0.0.0.0:${PORT:-3000}..."
exec node_modules/.bin/next start -H 0.0.0.0
