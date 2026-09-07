import { generateText, type UIMessage } from "ai";
import { eq } from "drizzle-orm";
import { z } from "zod";

import type {
  ConversationTranscriptEntry,
  Workflow,
  WorkflowField,
} from "@/db/schema";
import { db } from "@/db";
import { conversations } from "@/db/schema";
import {
  deriveSummary,
  isUrgent,
} from "@/lib/simulator/engine";
import { getModel } from "@/lib/agent/model";

export function toTranscript(messages: UIMessage[]): ConversationTranscriptEntry[] {
  const out: ConversationTranscriptEntry[] = [];
  for (const msg of messages) {
    if (msg.role !== "assistant" && msg.role !== "user") continue;
    for (const part of msg.parts) {
      if (part.type === "text" && part.text.trim()) {
        out.push({
          role: msg.role === "assistant" ? "assistant" : "customer",
          content: part.text.trim(),
        });
      }
    }
  }
  return out;
}

const extractionSchema = z.object({
  collectedData: z.record(z.string(), z.unknown()),
  intent: z.string().nullable(),
  summary: z.string().nullable(),
  callerName: z.string().nullable(),
  callerPhone: z.string().nullable(),
  isUrgent: z.boolean(),
  actionAfterCollection: z.string().max(100).nullable(),
});

export async function extractConversationMeta(
  workflow: Workflow,
  fields: WorkflowField[],
  transcript: ConversationTranscriptEntry[]
): Promise<z.infer<typeof extractionSchema>> {
  const collectable = fields.filter(
    (f) => !["caller_name", "phone"].includes(f.key)
  );

  const fieldLines = collectable
    .map((f) => {
      const choices = f.options?.length
        ? ` (choose from: ${f.options.join(" / ")})`
        : "";
      return `- "${f.key}" (${f.label})${choices} -> ${valueFormat(f.type)}`;
    })
    .join("\n");

  const urgencyFields = (workflow.conditions ?? [])
    .map((c) => `"${c.fieldKey}" ${CONDITION_OPERATOR_WORDS[c.operator] ?? c.operator} "${c.value}"`)
    .join("\n");

  const now = new Date().toISOString();

  const prompt = `You are transcribing a missed-call intake conversation for the business workflow "${workflow.name}".

Current time: ${now}

Conversation transcript (called by the customer):
${transcript.map((t) => `${t.role.toUpperCase()}: ${t.content}`).join("\n")}

Extract and return JSON with ONLY these keys:
{
  "collectedData": { object with a key for EVERY field key listed below. Each key must appear exactly as listed. Use null if the customer did not clearly provide it. Normalise the value to the specified format. },
  "intent": "a short intent label, e.g. 'Cake order enquiry' or null if unclear",
  "summary": "one sentence summarizing the request and key details booked/agreed, or null",
  "callerName": "the customer's name mentioned in the call, or null",
  "callerPhone": "the customer's phone number if mentioned (digits only), or null",
  "isUrgent": true or false based on the urgency rules below,
  "actionAfterCollection": "a 1-3 word action the business should perform after this call, e.g. 'Call back', 'Prepare order', 'Book appointment', 'Send invoice'. Concise, imperative. null only if no clear action."
}

Fields to extract into collectedData (use these exact keys, include them ALL even when null):
${fieldLines || "(none — only infer contextual keys)"}

URGENCY RULES — evaluate these against the extracted collectedData:
${urgencyFields || "(none)"}

Return "isUrgent": true if ANY urgency rule is satisfied based on what the customer said. Consider natural language expressions (e.g. "2 hours", "right now", "today", "ASAP") as satisfying time-based conditions. Return false if no rule matches or there are no rules.

Respond with JSON only, no markdown.`;

  const { text } = await generateText({
    model: getModel(),
    prompt,
  });

  const parsed = extractionSchema.safeParse(JSON.parse(stripJsonFences(text)));
  if (!parsed.success) {
    return {
      collectedData: {},
      intent: null,
      summary: null,
      callerName: null,
      callerPhone: null,
      isUrgent: false,
      actionAfterCollection: null,
    };
  }
  return parsed.data;
}

function valueFormat(type: string): string {
  switch (type) {
    case "number":
      return "a plain number, digits only (e.g. 2)";
    case "date":
      return "YYYY-MM-DD (e.g. 2026-09-05)";
    case "time":
      return "HH:MM 24h (e.g. 14:30)";
    case "choice":
      return "the exact chosen option, exactly as listed";
    default:
      return "the trimmed text value";
  }
}

const CONDITION_OPERATOR_WORDS: Record<string, string> = {
  eq: "is",
  neq: "is not",
  contains: "contains",
  gt: "is greater than",
  gte: "is >= ",
  lt: "is less than",
  lte: "is <= ",
  within_days: "is within",
};

function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  return (fence ? fence[1] : trimmed).trim();
}

export async function insertConversationRecord(input: {
  workflow: Workflow;
  transcript: ConversationTranscriptEntry[];
  meta: z.infer<typeof extractionSchema>;
  callerName?: string | null;
  callerPhone?: string | null;
  conversationId?: string | null;
}) {
  const { workflow, transcript, meta, conversationId } = input;
  const urgency = meta.isUrgent ?? isUrgent(workflow.conditions ?? [], meta.collectedData);
  const callerName =
    input.callerName?.trim() || meta.callerName?.trim() || null;
  const callerPhone =
    input.callerPhone?.trim() || meta.callerPhone?.trim() || null;
  const summaryText =
    meta.summary ??
    (callerName || Object.keys(meta.collectedData).length > 0
      ? deriveSummary(workflow, meta.collectedData)
      : null);

  const values = {
    callerName,
    callerPhone,
    status: "completed" as const,
    intent: meta.intent,
    collectedData: meta.collectedData,
    summary: summaryText,
    actionAfterCollection: meta.actionAfterCollection,
    urgency: urgency ? "urgent" : "normal",
    followUpStatus: "pending",
    transcript,
    updatedAt: new Date(),
  };

  if (conversationId) {
    await db
      .update(conversations)
      .set(values)
      .where(eq(conversations.id, conversationId));
    return;
  }

  await db.insert(conversations).values({
    businessId: workflow.businessId,
    workflowId: workflow.id,
    ...values,
  });
}