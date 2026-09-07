export const INDUSTRIES = [
  "Cake Shop",
  "Delivery / Logistics",
  "Clinic / Doctor",
  "Real Estate",
  "Home / Repair Service",
  "Other",
] as const;

export type Industry = (typeof INDUSTRIES)[number];

export const GOOGLE_CALENDAR_BASE = "https://www.googleapis.com/calendar/v3";
export const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";
export const GOOGLE_OAUTH_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

export const BUSINESS_LANGUAGES = ["english", "hindi"] as const;

export const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Karachi",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
] as const;

export const FIELD_TYPES = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "phone", label: "Phone number" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
  { value: "choice", label: "Choice (options)" },
] as const;

export const CONDITION_OPERATORS = [
  { value: "eq", label: "is equal to" },
  { value: "neq", label: "is not equal to" },
  { value: "contains", label: "contains" },
  { value: "gt", label: "is greater than" },
  { value: "gte", label: "is greater than or equal to" },
  { value: "lt", label: "is less than" },
  { value: "lte", label: "is less than or equal to" },
  { value: "within_days", label: "is within (N days)" },
] as const;

export const WORKFLOW_LANGUAGES = [
  { value: "english", label: "English" },
  { value: "hindi", label: "Hindi" },
] as const;

export const URGENCY_LEVELS = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "moderate", label: "Moderate" },
  { value: "urgent", label: "Urgent" },
] as const;

export const URGENCY_VALUES = URGENCY_LEVELS.map((u) => u.value) as [
  "low",
  "normal",
  "moderate",
  "urgent",
];