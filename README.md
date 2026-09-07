# Missed-Call Voice Agent Platform

An AI voice agent that answers **missed calls** for small businesses. A customer dials a shop, clinic, delivery service, or repair service; the agent picks up, runs a natural conversation in English or Hindi, collects the details the business cares about (order, appointment, lead, service request...), books calendar slots when the caller confirms a time, and stores a structured record the business can follow up on.

The product consists of two cooperating applications in this repository:

| Directory | What it is | Stack |
|---|---|---|
| [`web-ui/`](web-ui/) | Owner-facing web app: auth, business & workflow builder, Google Calendar connect, text **Chat Agent** and **Voice Agent** simulator, records dashboard. Also exposes the server-to-server HTTP endpoints the voice agent calls. | Next.js 16, React 19, TypeScript, Drizzle ORM + PostgreSQL, NextAuth, Vercel AI SDK, `@pipecat-ai/client-js` |
| [`voice-agent/`](voice-agent/) | Real-time audio agent. Holds a WebSocket call, runs STT → LLM → TTS and telephones-conversation flow, and executes business tools by calling back into the web app. | Python, FastAPI, Pipecat (pipecat-ai), Silero VAD, Sarvam AI TTS/STT, OpenAI-compatible LLM |

## Features

- **Missed-call intake** — the agent follows a business-configured workflow: greeting, one-question-at-a-time field collection, closing message.
- **Workflow builder** — create workflows from 5 industry templates (Cake Shop, Delivery/Logistics, Clinic/Doctor, Real Estate, Home/Repair) or build custom ones; fields (text, phone, number, date, time, choice, textarea) and **urgency conditions** that flag a record as urgent.
- **Two simulators** — a text **Chat Agent** and a real-time **Voice Agent** you can run in the browser to test a workflow end-to-end.
- **Google Calendar integration** — business owners connect their Google Calendar; the agent can check availability, book, reschedule, and cancel events after the caller confirms a time (encrypted refresh tokens at rest).
- **Record keeping** — every call is saved as a conversation record with transcript, extracted fields, intent, summary, the AI-determined action to take after the call, and urgency for the dashboard.
- **Bilingual** — English and Hindi workflows.
- **LLM-agnostic** — every model call (chat agent, voice agent, transcript extraction) uses any OpenAI-compatible endpoint (`LLM_API_KEY` / `LLM_API_ENDPOINT` / `LLM_MODEL`), tested with OpenRouter.

## Repository layout

```
.
├── web-ui/                  # Next.js owner app (deployed separately)
│   ├── src/app/             # Pages + API routes
│   ├── src/db/              # Drizzle schema + migrations
│   ├── src/lib/             # agent prompt/model, calendar, simulator, tools, token auth
│   └── .env.example
├── voice-agent/             # Python pipecat audio agent (deployed separately)
│   ├── src/voice_agent/     # main.py (/ws), bot.py pipeline, models, tools, settings
│   └── .env.example
└── docs/
    ├── requirement.txt      # product requirements (moved from repo root)
    ├── architecture.md      # system architecture & call flow
    └── database-schema.md   # data model & workflow data model
```

## Quick start

Prerequisites: Node 20+, `pnpm`, Python 3.11+, `uv`, and a PostgreSQL database
(local Postgres or Neon — Neon hostnames are resolved to IPv4 automatically).

### 1. Web app (`web-ui/`)

```bash
cd web-ui
pnpm install
cp .env.example .env.local   # fill in values (see below)
pnpm db:migrate              # apply Drizzle migrations (src/db/migrations)
pnpm dev                     # http://localhost:3000
```

Env vars (`web-ui/.env.example`):

| Variable | Purpose |
|---|---|
| `NEXTAUTH_SECRET` | NextAuth session signing secret |
| `NEXTAUTH_URL` | Public URL of the web app (e.g. `http://localhost:3000`) |
| `DATABASE_URL` | PostgreSQL / Neon connection string |
| `LLM_API_KEY` / `LLM_API_ENDPOINT` / `LLM_MODEL` | OpenAI-compatible LLM for chat agent + transcript extraction |
| `VOICE_AGENT_SECRET` | HMAC secret shared with the voice agent, signs per-call tokens |
| `VOICE_AGENT_URL` | Base URL of the Python voice agent, e.g. `ws://localhost:8765` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth app for Calendar connect |
| `GOOGLE_CALENDAR_ENCRYPTION_KEY` | 256-bit key (64 hex chars or raw string) encrypting stored refresh tokens |

### 2. Voice agent (`voice-agent/`)

```bash
cd voice-agent
uv sync
cp .env.example .env   # fill in values (see below)
uv run voice-agent     # serves ws://127.0.0.1:8765/ws
```

Env vars (`voice-agent/.env.example`):

| Variable | Purpose |
|---|---|
| `PORT` | WebSocket server port (default 8765) |
| `NEXTJS_URL` | Base URL of the web app (e.g. `http://localhost:3000`) |
| `LLM_API_KEY` / `LLM_API_ENDPOINT` / `LLM_MODEL` | OpenAI-compatible LLM for the spoken conversation |
| `SARVAM_API_KEY` | Optional Sarvam AI key |
| `TTS_PROVIDER` / `TTS_MODEL` | `sarvam` (e.g. `bulbul:v3`) or `openai` |
| `STT_PROVIDER` / `STT_MODEL` | `sarvam` or `openai` |

> **Must match:** `VOICE_AGENT_SECRET` must be identical in both apps, and
> `LLM_*` should point at the same provider so both apps speak the same model.

### 3. Try it
1. Register at `/register`. Create a **business** (`/app/businesses/new`).
2. Create a **workflow** (`/app/workflows/new`) — pick a template or build one.
3. Open the **Simulator** (`/app/simulator`) and pick **Chat Agent** (text) or **Voice Agent** (real audio — requires the voice-agent service running). The run is stored as a record.
4. Optionally connect **Google Calendar** (`/app/calendar`) so the agent can book real events.
5. Review saved calls under **Records** (`/app/records`) → detail pages show the transcript, extracted fields, urgency, and follow-up status.

## Deployment

Full instructions live in [`docs/deployment.md`](docs/deployment.md) —
Dokploy setup for both apps, environment wiring, WebSocket domain config, and
the local `docker compose` option.

Quick guidance:

- Deploy the two apps separately from this one repo: `web-ui` (Next.js) and
  `voice-agent` (Python/uv).
- For Next.js, prefer an auto-build platform (Dokploy Nixpacks or Railway
  Railpack) over a hand-written Dockerfile when available. A
  [`web-ui/Dockerfile`](web-ui/Dockerfile) exists for platforms that need one.
- The voice agent uses [`voice-agent/Dockerfile`](voice-agent/Dockerfile)
  (uv-based, port 8765, WebSocket path `/ws`).
- Set `VOICE_AGENT_URL` in the web app to the voice agent's public wss URL, and
  `NEXTJS_URL` in the voice agent to the web app's public https URL.

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — system architecture, WebSocket
  call lifecycle, token-authenticated server-to-server bridge, and the protobuf
  frame protocol.
- [`docs/database-schema.md`](docs/database-schema.md) — relational schema and
  the workflow/conversation data model.
- [`docs/deployment.md`](docs/deployment.md) — deploying both apps (Dokploy /
  Nixpacks / Railpack, `docker compose`, env wiring, WebSocket domains).
- [`docs/requirement.txt`](docs/requirement.txt) — product requirements.

## Roadmap

- External CRM integration for follow-up actions on collected conversations
  (only pending item in `docs/requirement.txt`; currently the web app surfaces
  records + follow-up status instead).