# ── TRT Platform — Dockerfile ─────────────────────────────────────────────────
#
# Build context : repo root (trt-platform/)
# Used by       : Railway (builder: DOCKERFILE)
#
# Stages:
#   deps    — install dependencies (cached until lockfile changes)
#   builder — prisma generate + next build
#   runner  — minimal production image

# ── Stage 1: deps ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Install from the monorepo root lockfile, scoped to the platform workspace.
# In npm workspaces the root package-lock.json is authoritative.
COPY package.json package-lock.json .npmrc ./
COPY apps/platform/package.json ./apps/platform/package.json

RUN npm ci --workspace apps/platform --include-workspace-root=false

# ── Stage 2: builder ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Bring in installed dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/package-lock.json ./package-lock.json
COPY --from=deps /app/apps/platform/package.json ./apps/platform/package.json

# Copy application source
COPY apps/platform ./apps/platform
COPY start.sh ./start.sh

# Generate Prisma client for the Linux/musl target inside this container.
# The local macOS binary will not work here — must be generated fresh.
RUN npm --workspace apps/platform run prisma:generate

# Build-time stubs.
#
# AUTH_SECRET is read by Auth.js at module-load time (when auth.ts is imported
# during bundle evaluation), so a placeholder is required even though the value
# is never used to sign or verify a real token during build.
#
# DATABASE_URL is intentionally absent: Prisma only opens a connection at query
# time, and all DB-dependent routes are marked `force-dynamic`, so no query is
# executed during `next build`. Railway injects the real DATABASE_URL at runtime.
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    AUTH_SECRET="build-placeholder-change-in-railway" \
    NEXTAUTH_URL="http://localhost:3000"

RUN npm --workspace apps/platform run build

# ── Stage 3: runner ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0

# Non-root user — Railway and container security best practice
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Standalone output: server.js + trimmed runtime node_modules + .next server files.
# With output:"standalone", Next.js bundles everything needed to run the server.
# The hashed external module IDs (e.g. @prisma/client-2c3a…) are only resolvable
# via the module map embedded in this server.js — not via `next start`.
COPY --from=builder --chown=nextjs:nodejs /app/apps/platform/.next/standalone ./

# Static assets — must be placed at the monorepo-relative path server.js expects
COPY --from=builder --chown=nextjs:nodejs /app/apps/platform/.next/static ./apps/platform/.next/static

# Public directory
COPY --from=builder --chown=nextjs:nodejs /app/apps/platform/public ./apps/platform/public

# Prisma schema + migrations (required by prisma migrate deploy at startup)
COPY --from=builder --chown=nextjs:nodejs /app/apps/platform/prisma ./prisma

# Full node_modules from builder — provides Prisma CLI for migrate deploy and
# the linux-musl Prisma Client binary generated during build.
# The standalone server.js resolves @prisma/client through its own embedded
# module map, so this layer does not conflict with the standalone runtime.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Production entrypoint — handles DB wait, migrations, and server start
COPY --from=builder --chmod=755 /app/start.sh ./start.sh

USER nextjs

# Railway injects PORT automatically. Next.js standalone server reads PORT + HOSTNAME.
EXPOSE 3000
ENV PORT=3000

CMD ["./start.sh"]
