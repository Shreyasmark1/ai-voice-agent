ARG NODE_VERSION=24.13.0-alpine

FROM node:${NODE_VERSION} AS deps

WORKDIR /app

RUN corepack enable

COPY web-ui/package.json web-ui/pnpm-lock.yaml web-ui/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:${NODE_VERSION} AS builder

WORKDIR /app

RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules

COPY web-ui/ ./

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

FROM node:${NODE_VERSION} AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]