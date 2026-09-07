# Database Schema & Workflow Data Model

Source of truth: `web-ui/src/db/schema.ts` (Drizzle). Migrations live in
`web-ui/src/db/migrations` and are applied with `pnpm db:migrate`.

PostgreSQL, managed through `drizzle-orm/node-postgres` + `pg`, with optional
Neon support (`web-ui/src/lib/db-neon.ts`).

## 1. Entities & relationships

```mermaiderDiagram
    users {
        text user_id PK
        varchar name
        varchar email UK
        timestamp email_verified
        text password_hash
        text image
    }
    businesses {
        text id PK
        text owner_id FK
        varchar name
        varchar industry
        text description
        varchar phone
        varchar timezone
        jsonb languages
        text logo_url
    }
    workflows {
        text id PK
        text business_id FK
        varchar name
        text description
        varchar trigger
        varchar language
        text greeting
        text closing_message
        jsonb conditions
        boolean active
    }
    workflow_fields {
        text id PK
        text workflow_id FK
        varchar key
        text label
        varchar type
        boolean required
        integer order
        jsonb options
        text placeholder
    }
    google_calendar_accounts {
        text user_id PK FK
        text business_id FK
        text refresh_token
        text access_token
        timestamp token_expires_at
        varchar calendar_id
        text scopes
    }
    conversations {
        text id PK
        text business_id FK
        text workflow_id FK
        varchar caller_name
        varchar caller_phone
        varchar status
        text intent
        jsonb collected_data
        text summary
        varchar action_after_collection
        varchar urgency
        varchar follow_up_status
        jsonb transcript
    }
```

## 2. Tables

### `users`

| Column | Type | Notes |
|---|---|---|
| `user_id` | text PK | UUID |
| `name` | varchar(255) | |
| `email` | varchar(255) UNIQUE | not null |
| `email_verified` | timestamp | |
| `password_hash` | text | bcrypt hash (Credentials provider) |
| `image` | text | |
| `created_at` / `updated_at` | timestamp | default now |

### `businesses`

The business a workflow belongs to (this is the "client" the missed call comes
in for), owned by one user.

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | UUID |
| `owner_id` | text FK → `users.user_id` | cascade delete |
| `name` | varchar(255) | |
| `industry` | varchar(100) | one of `web-ui/src/lib/constants.ts` industries; used by template picker |
| `description` | text | |
| `phone` | varchar(30) | |
| `timezone` | varchar(100) | default `Asia/Kolkata`; drives "current time" in prompts |
| `languages` | jsonb `string[]` | default `["english"]` |
| `logo_url` | text | |
| `created_at` / `updated_at` | timestamp | |

Index: `businesses_owner_id_idx`.

### `workflows`

A workflow is **the configuration for one missed-call scenario** (a template
instantiation). Schema:

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | UUID |
| `business_id` | text FK → `businesses.id` | cascade delete |
| `name` | varchar(255) | |
| `description` | text | |
| `trigger` | varchar(50) | default `missed_call` |
| `language` | varchar(50) | `english` \| `hindi` |
| `greeting` | text | first assistant message |
| `closing_message` | text | exact text the agent uses to end; UI auto-saves when it appears |
| `conditions` | jsonb `WorkflowCondition[]` | urgency rules (see §4) |
| `active` | boolean | default true |
| `created_at` / `updated_at` | timestamp | |

Index: `workflows_business_id_idx`.

### `workflow_fields`

Per-workflow questions the agent must collect. Rendered into the system prompt
in `order` sequence as "DATA FIELDS TO COLLECT".

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | UUID |
| `workflow_id` | text FK → `workflows.id` | cascade delete |
| `key` | varchar(100) | machine key stored under `collectedData` / `fields` |
| `label` | text | natural-language question to ask the caller |
| `type` | varchar(50) | `WorkflowFieldType` |
| `required` | boolean | default false |
| `order` | integer | sort order |
| `options` | jsonb `string[]` | for `choice` fields |
| `placeholder` | text | example / hint |

Index: `workflow_fields_workflow_id_idx`.

### `google_calendar_accounts`

One per user (PK = `user_id`). Refresh token is encrypted at rest
(AES-256-GCM, 64-hex or raw 32-byte `GOOGLE_CALENDAR_ENCRYPTION_KEY`).

| Column | Type | Notes |
|---|---|---|
| `user_id` | text PK FK → `users.user_id` | cascade delete |
| `business_id` | text FK → `businesses.id` | set null |
| `refresh_token` | text | encrypted |
| `access_token` | text | cached, refreshed on demand |
| `token_expires_at` | timestamp | |
| `calendar_id` | varchar(255) | default `primary` |
| `scopes` | text | |
| `connected_at` / `updated_at` | timestamp | |

Index: `google_calendar_accounts_business_id_idx`.

Presence of a row ⇒ `/api/calls/config` includes `"calendar"` in
`availableTools` ⇒ agent can book real events via `/api/tools`.

### `conversations`

One row per handled call. Primary dashboard/records entity.

| Column | Type | Notes |
|---|---|---|
| `id` | text PK | UUID |
| `business_id` | text FK → `businesses.id` | cascade |
| `workflow_id` | text FK → `workflows.id` | cascade |
| `caller_name` / `caller_phone` | varchar | from simulator form or extracted |
| `status` | varchar(30) | default `completed`; `in_progress` while a call runs |
| `intent` | text | extracted short intent label |
| `collected_data` | jsonb `Record<string, unknown>` | all workflow field keys → extracted values |
| `summary` | text | one-sentence summary |
| `action_after_collection` | varchar(100) | LLM-evaluated 1-3 word action the business should perform after the call (e.g. "Call back") |
| `urgency` | varchar(20) | `low` \| `normal` \| `moderate` \| `urgent` |
| `follow_up_status` | varchar(40) | default `pending`; toggled on the record page |
| `transcript` | jsonb `ConversationTranscriptEntry[]` | `{role: "assistant"\|"customer", content}` |
| `created_at` / `updated_at` | timestamp | |

Indexes: `conversations_business_id_idx`, `conversations_workflow_id_idx`.

## 3. Enums / unions (TypeScript)

Defined as string unions in `web-ui/src/db/schema.ts` (stored as plain
varchar/jsonb; no PG enums).

```ts
type WorkflowFieldType =
  | "text" | "textarea" | "phone" | "number"
  | "date" | "time" | "choice";

type ConditionOperator =
  | "eq" | "neq" | "contains"
  | "gt" | "gte" | "lt" | "lte"
  | "within_days";         // value = number of days
```

## 4. Workflow conditions & the urgency model

A workflow carries a list of conditions (`workflows.conditions`, jsonb):

```ts
type Urgency = "low" | "normal" | "moderate" | "urgent";

type WorkflowCondition = {
  id: string;                 // uuid
  fieldKey: string;           // must match a workflow field key
  operator: ConditionOperator;
  value: string;              // e.g. "1" for within_days, or an option label
  urgency: Urgency;           // level to set when the condition matches
};
```

- Conditions are rendered into the system prompt under "URGENCY RULES" so the
  agent knows a call's severity while talking (`low` / `normal` / `moderate` /
  `urgent`).
- After the call, urgency is determined **twice** and the higher level wins:
  1. `extractConversationMeta` (LLM) evaluates the rules against
     `collectedData` relative to the current time and picks the highest
     matched level
     (`web-ui/src/lib/agent/persistence.ts`);
  2. deterministic fallback `deriveUrgency()` (`web-ui/src/lib/simulator/engine.ts`)
     applies the same rules over the extracted values and returns the highest
     matched level (numeric comparisons and `within_days` use calendar math;
     `within_days` counts from today up to N days out).
- The saved value uses `maxSeverity(LLM pick, deterministic pick)`,
  stored as `conversations.urgency`.

Example (Cake Shop template): `required_date within_days 1 ⇒ urgency "urgent"`.

## 5. Workflow data model (how a workflow drives the agent)

```
workflow (greeting, closing, language)
  ├── workflowFields (ordered questions: key, label, type, required, options)
  ├── conditions (urgency rules → mark_urgent)
  └── business (name, industry, timezone, phone → prompt context)
```

- The **system prompt** is generated deterministically from the above
  (`web-ui/src/lib/agent/prompt.ts`) and shared verbatim between the chat
  simulator (`/api/agent/chat`), the voice agent (`/api/calls/config`), and
  post-call extraction.
- Field keys `caller_name` and `phone` are treated specially: they are never
  listed as collectable in the prompt and are extracted straight into the
  matching `conversations` columns.
- Templates (`web-ui/src/lib/templates.ts`) provide 5 pre-built workflows
  (Cake Shop, Delivery/Logistics, Clinic/Doctor, Real Estate, Home/Repair);
  the builder persists them as `workflows` + `workflow_fields` rows.

## 6. Conversation record pipeline

1. `startConversationAction` — insert `conversations` row
   (`status="in_progress"`), return its id.
2. Call runs (chat or voice) and a transcript accumulates.
3. `finalizeAgentConversationAction`:
   - convert transcript to `ConversationTranscriptEntry[]`;
   - `extractConversationMeta` LLM-extracts `collectedData / intent /
     summary / callerName / callerPhone / urgency / actionAfterCollection`;
   - `insertConversationRecord` upserts the row `status="completed"`,
     `urgency`, `action_after_collection`,
     `follow_up_status="pending"`.
4. Owner views the record (`/app/records/[id]`) and can flip
   `follow_up_status` (e.g. `pending → contacted/closed`).

## 7. Notes

- **Migrations:** `0000` creates the base tables; `0001` adds
  `google_calendar_accounts`; `0002` drops `workflows.action_after_collection`
  and `conversations.simulated`, and renames
  `conversations.action_performed` → `action_after_collection`. Generate new
  ones with `pnpm db:generate`, apply with `pnpm db:migrate`.
- **No foreign keys to voice-agent**: the Python service owns no DB tables; it
  authenticates via the signed token and reads/writes only through the web
  app's HTTP endpoints.
- **`crypto.randomUUID()`** default allocates PKs in the app (not the DB).
- `web-ui/.env.local` / `web-ui/.env` are gitignored; `DATABASE_URL` is the
  only secret needed for the DB to connect.