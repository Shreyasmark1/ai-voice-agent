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

export type AgentLanguage = { code: string; label: string };

export const AGENT_LANGUAGES: AgentLanguage[] = [
  { code: "en-IN", label: "English" },
  { code: "hi-IN", label: "Hindi" },
  { code: "ta-IN", label: "Tamil" },
  { code: "te-IN", label: "Telugu" },
  { code: "kn-IN", label: "Kannada" },
  { code: "ml-IN", label: "Malayalam" },
  { code: "mr-IN", label: "Marathi" },
  { code: "gu-IN", label: "Gujarati" },
  { code: "bn-IN", label: "Bengali" },
  { code: "pa-IN", label: "Punjabi" },
  { code: "od-IN", label: "Odia" },
];

export type AgentVoice = { id: string; label: string; gender: "Male" | "Female" };

export const SARVAM_VOICES: AgentVoice[] = [
  { id: "shubh", label: "Shubh", gender: "Male" },
  { id: "aditya", label: "Aditya", gender: "Male" },
  { id: "amit", label: "Amit", gender: "Male" },
  { id: "ashutosh", label: "Ashutosh", gender: "Male" },
  { id: "aayan", label: "Aayan", gender: "Male" },
  { id: "dev", label: "Dev", gender: "Male" },
  { id: "kabir", label: "Kabir", gender: "Male" },
  { id: "manan", label: "Manan", gender: "Male" },
  { id: "rahul", label: "Rahul", gender: "Male" },
  { id: "ratan", label: "Ratan", gender: "Male" },
  { id: "rohan", label: "Rohan", gender: "Male" },
  { id: "sumit", label: "Sumit", gender: "Male" },
  { id: "varun", label: "Varun", gender: "Male" },
  { id: "priya", label: "Priya", gender: "Female" },
  { id: "neha", label: "Neha", gender: "Female" },
  { id: "pooja", label: "Pooja", gender: "Female" },
  { id: "simran", label: "Simran", gender: "Female" },
  { id: "kavya", label: "Kavya", gender: "Female" },
  { id: "ishita", label: "Ishita", gender: "Female" },
  { id: "shreya", label: "Shreya", gender: "Female" },
  { id: "roopa", label: "Roopa", gender: "Female" },
  { id: "ritu", label: "Ritu", gender: "Female" },
  { id: "amelia", label: "Amelia", gender: "Female" },
  { id: "sophia", label: "Sophia", gender: "Female" },
];

export const DEFAULT_LANGUAGE = "en-IN";
export const DEFAULT_VOICE = "shubh";

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