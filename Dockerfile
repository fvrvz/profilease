# syntax=docker/dockerfile:1

# -------------------------------------------------------------
# STAGE 1: Dependencies Installation
# -------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci

# -------------------------------------------------------------
# STAGE 2: Build Application
# -------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
RUN npx nx build web

# Clean dev dependencies for lean runner image
RUN npm prune --omit=dev

# -------------------------------------------------------------
# STAGE 3: Production Runner
# -------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Security: Run as unprivileged user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 profilease

COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=profilease:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=profilease:nodejs /app/dist/apps/web ./dist/apps/web

USER profilease

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:4000/api/profiles || exit 1

CMD ["node", "dist/apps/web/server/server.mjs"]
