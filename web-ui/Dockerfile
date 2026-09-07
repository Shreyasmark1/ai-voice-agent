ARG NODE_VERSION=24.13.0-alpine

FROM node:${NODE_VERSION} AS deps

WORKDIR /app

RUN corepack enable

COPY web-ui/package.json web-ui/pnpm-lock.yaml web-ui/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:${NODE_VERSION} AS builder

WORKDIR /app

ARG DATABASE_URL
ARG NEXTAUTH_SECRET
ARG NEXTAUTH_URL
ARG LLM_API_KEY
ARG LLM_API_ENDPOINT
ARG LLM_MODEL
ARG VOICE_AGENT_SECRET
ARG VOICE_AGENT_URL
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG GOOGLE_CALENDAR_ENCRYPTION_KEY

ENV DATABASE_URL=${DATABASE_URL}
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV LLM_API_KEY=${LLM_API_KEY}
ENV LLM_API_ENDPOINT=${LLM_API_ENDPOINT}
ENV LLM_MODEL=${LLM_MODEL}
ENV VOICE_AGENT_SECRET=${VOICE_AGENT_SECRET}
ENV VOICE_AGENT_URL=${VOICE_AGENT_URL}
ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
ENV GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
ENV GOOGLE_CALENDAR_ENCRYPTION_KEY=${GOOGLE_CALENDAR_ENCRYPTION_KEY}

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