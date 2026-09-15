import type {
  Business,
  WorkflowCondition,
  WorkflowField,
} from "@/db/schema";

export function formatFieldLine(field: WorkflowField): string {
  const optionality = field.required ? "REQUIRED" : "optional";
  const choices = field.options?.length
    ? ` (must pick one of: ${field.options.join(" / ")})`
    : "";
  const hint = field.placeholder ? ` (e.g. ${field.placeholder})` : "";
  return `- ${field.label} [type=${field.type}] [${optionality}]${choices}${hint} -> store as key "${field.key}"`;
}

export function formatFieldLines(fields: WorkflowField[]): string {
  return fields
    .filter((f) => !["caller_name", "phone"].includes(f.key))
    .map(formatFieldLine)
    .join("\n");
}

export function formatConditionLine(condition: WorkflowCondition): string {
  const op = CONDITION_OPERATOR_TEXT[condition.operator] ?? condition.operator;
  const urgency = condition.urgency ?? "urgent";
  return `- If collected field "${condition.fieldKey}" ${op} "${condition.value}", treat the call as ${urgency.toUpperCase()} and record urgency "${urgency}".`;
}

export function formatConditionLines(conditions: WorkflowCondition[]): string {
  return conditions.map(formatConditionLine).join("\n");
}

export function formatBusinessIntro(business: Business): string {
  const now = new Date().toLocaleString("en-US", {
    timeZone: business.timezone,
    dateStyle: "full",
    timeStyle: "short",
  });

  return [
    `You are a voice assistant handling a missed call for "${business.name}", a ${business.industry} business in ${business.timezone}.`,
    `The current date and time is ${now} (${business.timezone}).`,
    business.description ? `About the business: ${business.description}` : "",
    business.phone ? `Business phone number: ${business.phone}` : "",
  ]
    .filter(Boolean)
    .join("\n");
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