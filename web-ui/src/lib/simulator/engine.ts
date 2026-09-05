import type {
  Workflow,
  WorkflowAction,
  WorkflowCondition,
} from "@/db/schema";

const ACTION_SUMMARIES: Record<WorkflowAction, string> = {
  order_enquiry: "Created an order enquiry",
  delivery_request: "Created a delivery request",
  appointment_request: "Created an appointment request",
  callback_request: "Created a callback request",
  qualified_lead: "Created a qualified lead",
  service_request: "Created a service request",
  freeform: "Recorded the enquiry",
};

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,;:!?]+$/, "")
    .trim();
}

function toNumber(value: string): number {
  const cleaned = value.replace(/[^0-9.\-]/g, "");
  const n = Number(cleaned);
  return Number.isNaN(n) ? NaN : n;
}

function evaluateCondition(
  condition: WorkflowCondition,
  collected: Record<string, unknown>
): boolean {
  const raw = collected[condition.fieldKey];
  if (raw === undefined || raw === null) return false;
  const actualRaw = String(raw);
  const expected = condition.value.trim();
  const norm = (v: string) => normalizeText(v);

  switch (condition.operator) {
    case "eq":
      return norm(actualRaw) === norm(expected);
    case "neq":
      return norm(actualRaw) !== norm(expected);
    case "contains":
      return norm(actualRaw).includes(norm(expected));
    case "within_days": {
      const rawDate = raw instanceof Date ? raw.toISOString() : actualRaw;
      const at = Date.parse(rawDate);
      if (Number.isNaN(at)) return false;
      const days = Number(expected);
      if (Number.isNaN(days)) return false;
      const now = Date.now();
      const target = now + days * 24 * 60 * 60 * 1000;
      // within N days (from today up to N days out)
      return at <= target && at >= now - 24 * 60 * 60 * 1000;
    }
    case "gt": {
      const a = toNumber(actualRaw);
      const b = toNumber(expected);
      return !Number.isNaN(a) && !Number.isNaN(b) && a > b;
    }
    case "gte": {
      const a = toNumber(actualRaw);
      const b = toNumber(expected);
      return !Number.isNaN(a) && !Number.isNaN(b) && a >= b;
    }
    case "lt": {
      const a = toNumber(actualRaw);
      const b = toNumber(expected);
      return !Number.isNaN(a) && !Number.isNaN(b) && a < b;
    }
    case "lte": {
      const a = toNumber(actualRaw);
      const b = toNumber(expected);
      return !Number.isNaN(a) && !Number.isNaN(b) && a <= b;
    }
    default:
      return false;
  }
}

export function isUrgent(
  conditions: WorkflowCondition[],
  collected: Record<string, unknown>
) {
  return conditions.some((c) => evaluateCondition(c, collected));
}

export function deriveSummary(
  workflow: Workflow,
  collected: Record<string, unknown>
): string {
  const name = collected.caller_name ?? collected.full_name ?? collected.patient_name ?? "Caller";
  const phone = collected.phone ?? "";
  const parts = [`${name} (${phone || "no phone"})`];
  const core =
    collected.order_type ??
    collected.request_type ??
    collected.appointment_type ??
    collected.interest ??
    collected.service_type;
  if (core) parts.push(`intent: ${core}`);
  return parts.join(" - ");
}

export { ACTION_SUMMARIES };
