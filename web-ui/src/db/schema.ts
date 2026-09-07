import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export type WorkflowFieldType =
  | "text"
  | "textarea"
  | "phone"
  | "number"
  | "date"
  | "time"
  | "choice";

export type ConditionOperator =
  | "eq"
  | "neq"
  | "contains"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "within_days";

export type WorkflowCondition = {
  id: string;
  fieldKey: string;
  operator: ConditionOperator;
  value: string;
  outcome: "mark_urgent";
};

export const users = pgTable("users", {
  userId: text("user_id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  passwordHash: text("password_hash"),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
},
  (table) => [uniqueIndex("users_email_idx").on(table.email),]
);

export const businesses = pgTable("businesses",{
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.userId, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    industry: varchar("industry", { length: 100 }).notNull(),
    description: text("description"),
    phone: varchar("phone", { length: 30 }),
    timezone: varchar("timezone", { length: 100 }).notNull().default("Asia/Kolkata"),
    languages: jsonb("languages").$type<string[]>().notNull().default(["english"]),
    logoUrl: text("logo_url"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("businesses_owner_id_idx").on(table.ownerId)]
);

export type Business = typeof businesses.$inferSelect;

export const workflows = pgTable("workflows",{
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    trigger: varchar("trigger", { length: 50 }).notNull().default("missed_call"),
    language: varchar("language", { length: 50 }).notNull().default("english"),
    greeting: text("greeting").notNull(),
    closingMessage: text("closing_message").notNull(),
    conditions: jsonb("conditions")
      .$type<WorkflowCondition[]>()
      .notNull()
      .default([]),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("workflows_business_id_idx").on(table.businessId)]
);

export type Workflow = typeof workflows.$inferSelect;

export const workflowFields = pgTable("workflow_fields",{
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    workflowId: text("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    key: varchar("key", { length: 100 }).notNull(),
    label: text("label").notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    required: boolean("required").notNull().default(false),
    order: integer("order").notNull().default(0),
    options: jsonb("options").$type<string[]>().notNull().default([]),
    placeholder: text("placeholder"),
  },
  (table) => [index("workflow_fields_workflow_id_idx").on(table.workflowId)]
);

export type WorkflowField = typeof workflowFields.$inferSelect;

export type ConversationTranscriptEntry = {
  role: "assistant" | "customer";
  content: string;
};

export const googleCalendarAccounts = pgTable(
  "google_calendar_accounts",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => users.userId, { onDelete: "cascade" }),
    businessId: text("business_id")
      .references(() => businesses.id, { onDelete: "set null" }),
    refreshToken: text("refresh_token").notNull(),
    accessToken: text("access_token"),
    tokenExpiresAt: timestamp("token_expires_at", { mode: "date" }),
    calendarId: varchar("calendar_id", { length: 255 }).notNull().default("primary"),
    scopes: text("scopes"),
    connectedAt: timestamp("connected_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("google_calendar_accounts_business_id_idx").on(table.businessId)]
);

export const conversations = pgTable("conversations",{
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    businessId: text("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    workflowId: text("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    callerName: varchar("caller_name", { length: 255 }),
    callerPhone: varchar("caller_phone", { length: 30 }),
    status: varchar("status", { length: 30 }).notNull().default("completed"),
    intent: text("intent"),
    collectedData: jsonb("collected_data").$type<Record<string, unknown>>().notNull().default({}),
    summary: text("summary"),
    actionAfterCollection: varchar("action_after_collection", { length: 100 }),
    urgency: varchar("urgency", { length: 20 }).notNull().default("normal"),
    followUpStatus: varchar("follow_up_status", { length: 40 })
      .notNull()
      .default("pending"),
    transcript: jsonb("transcript")
      .$type<ConversationTranscriptEntry[]>()
      .notNull()
      .default([]),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    index("conversations_business_id_idx").on(table.businessId),
    index("conversations_workflow_id_idx").on(table.workflowId),
  ]
);
