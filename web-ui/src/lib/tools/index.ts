import type { ToolSet } from "ai";

import type { CalendarService } from "@/lib/calendar";
import { CALENDAR_TOOL_SUMMARY, CalendarTools } from "./calendar/calendar-tools";

// Tool executions we surface to the user as a small note, aggregated per tool group.
export const TOOL_SUMMARY: Record<string, string> = {
  ...CALENDAR_TOOL_SUMMARY,
};

export type ToolServices = {
  calendar?: CalendarService | null;
};

export function getTools({ calendar }: ToolServices): ToolSet {

  const calendarTools = calendar ? CalendarTools.getTools(calendar) : {}

  return {
    ...calendarTools
    // TODO: add CRM tools
  };
}