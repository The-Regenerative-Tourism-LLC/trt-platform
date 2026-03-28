# ── TRT Platform — Dockerfile ─────────────────────────────────────────────────
#
# Build context: apps/platform/
# Railway: set Root Directory = apps/platform/ in service settings.
#
# Stages:
#   deps    — install all dependencies (cached until lockfile changes)
#   builder — generate Prisma client + build Next.js
#   runner  — minimal production image
#
# Usage (local):
#   docker build -t trt-platform .
#   docker run -e DATABASE_URL=... -e AUTH_SECRET=... -p 3000:3000 trt-platform

# ── Stage 1: deps ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only manifests — this layer is cached until these files change
COPY package.json package-lock.json .npmrc ./

# ci install: exact lockfile versions, no audit, no fund messages
RUN npm ci --ignore-scripts

# ── Stage 2: builder ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Bring in installed dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Generate Prisma client for the container's Linux/musl target.
# Must run inside the container — the local macOS binary won't work here.
RUN npx prisma generate

# Build Next.js production output
ENV NODE_ENV=production
RUN npm run build

# ── Stage 3: runner ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Non-root user — Railway and general container security best practice
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Next.js build output
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Runtime dependencies (includes Prisma CLI for migrate deploy)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Prisma schema + migrations (needed for migrate deploy at startup)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Next.js config
COPY --from=builder /app/next.config.ts ./next.config.ts

USER nextjs

# Railway injects PORT automatically. Next.js 13.5+ respects it natively.
EXPOSE 3000
ENV PORT=3000

# Run pending migrations then start the server.
# prisma migrate deploy is safe to run on every boot — it's a no-op if up to date.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
