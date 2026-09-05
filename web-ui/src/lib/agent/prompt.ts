import type {
  Business,
  Workflow,
  WorkflowCondition,
  WorkflowField,
} from "@/db/schema";
type AgentContext = {
  business: Business;
  workflow: Workflow;
  fields: WorkflowField[];
};

export function buildSystemPrompt(context: AgentContext): string {
  const { business, workflow, fields } = context;
  const language = (workflow.language as string).toLowerCase();
  const isHindi = language.startsWith("hi");

  const fieldLines = fields
    .filter((f) => !["caller_name", "phone"].includes(f.key))
    .map((f) => {
      const optionality = f.required ? "REQUIRED" : "optional";
      const choices = f.options?.length
        ? ` (must pick one of: ${f.options.join(" / ")})`
        : "";
      const hint = f.placeholder ? ` (e.g. ${f.placeholder})` : "";
      return `- ${f.label} [type=${f.type}] [${optionality}]${choices}${hint} -> store as key "${f.key}"`;
    })
    .join("\n");

  const conditionLines = (workflow.conditions ?? [])
    .map((c) => formatCondition(c))
    .join("\n");

  const instructionLanguage = isHindi
    ? "You must respond entirely in Hindi (Hinglish/Hindi script is fine, but keep it natural and spoken). The workflow is configured for Hindi speakers."
    : "You must respond in clear, friendly, natural English. Use spoken, conversational tone as if on a phone call.";

  const actionInstruction = actionLine(workflow.actionAfterCollection);

  const now = new Date().toLocaleString("en-US", {
    timeZone: business.timezone,
    dateStyle: "full",
    timeStyle: "short",
  });

  const businessLine = [
    `You are a voice assistant handling a missed call for "${business.name}", a ${business.industry} business in ${business.timezone}.`,
    `The current date and time is ${now} (${business.timezone}).`,
    business.description ? `About the business: ${business.description}` : "",
    business.phone ? `Business phone number: ${business.phone}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `${businessLine}

${instructionLanguage}

Your job is to have a natural conversation with the caller and:
1. Greet them warmly.
2. Collect the required details below by asking one question at a time (ask naturally, not like a list). Do not ask more than one open question at once.
3. Whenever the caller gives a time for ANY request — appointment, order pickup/delivery (e.g. "I need a cake within 2 hours"), service visit, consultation, etc. — FIRST confirm the exact date and time with the caller and get their agreement out loud before booking. Only after they confirm, book it on the calendar: check availability for that slot, then create the event (or reschedule/cancel an existing one). If the caller gives only a relative timeframe (e.g. "within 2 hours", "as soon as possible", "today", "tomorrow"), propose a concrete slot based on the current date/time given above (e.g. "within 2 hours" -> a slot starting now, roughly 1 hour long; "today" -> a slot later today; "tomorrow" -> the same time tomorrow) and confirm it with the caller before booking. Only book when the caller has confirmed the time; if none is given, just record the request.
4. Support any reasonable ad-hoc requests politely.
5. Once the request is fully handled (e.g. the booking is confirmed done), confirm the outcome to the caller and close the call warmly — do not end abruptly, do not ask for additional non-required fields, and do not end the conversation mid-tool-call. Use the exact closing message to end with:
   "${workflow.closingMessage}"

DATA FIELDS TO COLLECT:
${fieldLines || "(none required)"}

URGENCY RULES (if any of these are true, the call should be treated as URGENT and prioritised):
${conditionLines || "(none)"}

You are ONLY a spoken-voice assistant for this one call. Do not answer questions unrelated to the business. If the caller is confused, repeat the question in a friendlier way. Keep replies short and natural — like talking on the phone.

Action to take/record after the call: ${actionInstruction}`;
}

function formatCondition(c: WorkflowCondition): string {
  const op = CONDITION_OPERATOR_TEXT[c.operator] ?? c.operator;
  return `- If collected field "${c.fieldKey}" ${op} "${c.value}", treat the call as URGENT${c.outcome === "mark_urgent" ? " and mark it urgent" : ""}.`;
}

const CONDITION_OPERATOR_TEXT: Record<string, string> = {
  eq: "is equal to",
  neq: "is not equal to",
  contains: "contains",
  gt: "is greater than",
  gte: "is greater than or equal to",
  lt: "is less than",
  lte: "is less than or equal to",
  within_days: "is within",
};

function actionLine(action: string | null | undefined): string {
  switch (action) {
    case "order_enquiry":
      return "Record an order enquiry so the business can call back to confirm. If the caller gives a delivery/pickup time (e.g. \"within 2 hours\"), book it on the calendar.";
    case "delivery_request":
      return "Create a delivery request so the business can arrange delivery. If the caller gives a delivery time (e.g. \"within 2 hours\"), book it on the calendar.";
    case "appointment_request":
      return "Create an appointment request and, where a slot is chosen, use the calendar to book the time.";
    case "callback_request":
      return "Log a callback request with the caller's details so the business can call back.";
    case "qualified_lead":
      return "Qualify the caller as a lead and note their interest.";
    case "service_request":
      return "Log a service request so the business can follow up. If the caller gives a visit/service time, book it on the calendar.";
    default:
      return "Reason about the request from context, and if the caller gives a date/time, book it on the calendar.";
  }
}