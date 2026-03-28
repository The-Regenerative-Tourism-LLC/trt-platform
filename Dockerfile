# ── TRT Platform — Root Dockerfile ────────────────────────────────────────────
#
# Build context: repo root (trt-platform/)
# Used by: Railway (builder: DOCKERFILE)
#
# For local development builds from apps/platform/, use apps/platform/Dockerfile.
#
# Stages:
#   deps    — install all dependencies (cached until lockfile changes)
#   builder — generate Prisma client for Linux + build Next.js
#   runner  — minimal production image

# ── Stage 1: deps ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only manifests — layer is cached until these files change
COPY apps/platform/package.json apps/platform/package-lock.json apps/platform/.npmrc ./

RUN npm ci --ignore-scripts

# ── Stage 2: builder ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Bring in installed dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all app source files
COPY apps/platform/ .

# Generate Prisma client for the Linux/musl target inside this container.
# The local macOS binary will not work here — must be generated fresh.
RUN npx prisma generate

# Build Next.js production output
ENV NODE_ENV=production
RUN npm run build

# ── Stage 3: runner ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Non-root user — Railway and container security best practice
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Next.js build output
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Runtime dependencies (node_modules includes Prisma CLI for migrate deploy)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Prisma schema + migrations (required by prisma migrate deploy at startup)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Next.js config
COPY --from=builder /app/next.config.ts ./next.config.ts

USER nextjs

# Railway injects PORT automatically. Next.js 13.5+ respects it natively.
EXPOSE 3000
ENV PORT=3000

# Run pending migrations on every boot (no-op if already up to date), then start.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
