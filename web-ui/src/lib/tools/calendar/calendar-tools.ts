import { tool, type ToolSet } from "ai";
import { z } from "zod";

import type { CalendarService } from "@/lib/calendar";

export const CALENDAR_TOOL_SUMMARY: Record<string, string> = {
  "calendar-check-availability": "📅 Slot available",
  "calendar-create-event": "📅 Slot booked",
  "calendar-reschedule-event": "📅 Slot rescheduled",
  "calendar-cancel-event": "📅 Booking cancelled",
  "calendar-list-events": "📅 Calendar checked",
};

const checkAvailabilitySchema = z.object({
  start: z.string().describe("ISO 8601 start datetime, e.g. 2026-09-02T10:00:00+05:30"),
  end: z.string().describe("ISO 8601 end datetime, e.g. 2026-09-02T10:30:00+05:30"),
  timezone: z.string().optional().describe("IANA timezone, e.g. Asia/Kolkata"),
});

const listEventsSchema = z.object({
  from: z.string().describe("ISO 8601 start datetime"),
  to: z.string().describe("ISO 8601 end datetime"),
  timezone: z.string().optional().describe("IANA timezone"),
});

const createEventSchema = z.object({
  summary: z.string().describe("Short title for the booking, e.g. 'Appointment - Priya'"),
  description: z.string().optional().describe("Optional notes about the booking"),
  start: z.string().describe("ISO 8601 start datetime"),
  end: z.string().describe("ISO 8601 end datetime"),
  attendees: z.array(z.string()).optional().describe("Optional attendee emails"),
  timezone: z.string().optional().describe("IANA timezone"),
});

const rescheduleEventSchema = z.object({
  eventId: z.string().describe("The id of the event to move"),
  start: z.string().describe("ISO 8601 new start datetime"),
  end: z.string().describe("ISO 8601 new end datetime"),
  timezone: z.string().optional().describe("IANA timezone"),
});

const cancelEventSchema = z.object({
  eventId: z.string().describe("The id of the event to cancel"),
});

export class CalendarTools {

  private constructor(private service: CalendarService) { }

  checkAvailabilityTool() {

    return tool({
      description: "Check whether a time slot is free in the business calendar. Use this BEFORE proposing a booking time to the caller.",
      inputSchema: checkAvailabilitySchema,
      execute: (args) => {
        const { start, end, timezone } = checkAvailabilitySchema.parse(args);
        return this.service.checkAvailability(start, end, timezone ?? "Asia/Kolkata");
      },
    })

  };

  listEventsTool() {

    return tool({
      description: "List events in the business calendar between two datetimes.",
      inputSchema: listEventsSchema,
      execute: (args) => {
        const { from, to, timezone } = listEventsSchema.parse(args);
        return this.service.listEvents(from, to, timezone ?? "Asia/Kolkata");
      },
    })

  };

  createEventTool() {

    return tool({
      description: "Book a confirmed event in the business calendar. Only call this after the caller picks an available slot (verified via checkCalendarAvailability).",
      inputSchema: createEventSchema,
      execute: (args) => {
        const input = createEventSchema.parse(args);
        const timezone = input.timezone ?? "Asia/Kolkata";
        return this.service.createEvent(
          {
            summary: input.summary,
            description: input.description,
            start: input.start,
            end: input.end,
            attendees: input.attendees,
            timezone,
          },
          timezone
        );
      },
    })

  };

  rescheduleEventTool() {

    return tool({
      description: "Move an existing event to a new time. Check availability of the new slot first.",
      inputSchema: rescheduleEventSchema,
      execute: (args) => {
        const { eventId, start, end, timezone } = rescheduleEventSchema.parse(args);
        return this.service.rescheduleEvent(eventId, {
          start,
          end,
          timezone: timezone ?? "Asia/Kolkata",
        });
      },
    })

  };

  cancelEventTool() {

    return tool({
      description: "Cancel/delete an existing event in the business calendar.",
      inputSchema: cancelEventSchema,
      execute: async (args) => {
        const { eventId } = cancelEventSchema.parse(args);
        await this.service.cancelEvent(eventId);
        return { ok: true, eventId };
      },
    })
    
  };

  static getTools(service: CalendarService): ToolSet {

    const tools = new CalendarTools(service)

    return {
      "calendar-check-availability": tools.checkAvailabilityTool(),
      "calendar-list-events": tools.listEventsTool(),
      "calendar-create-event": tools.createEventTool(),
      "calendar-reschedule-event": tools.rescheduleEventTool(),
      "calendar-cancel-event": tools.cancelEventTool(),
    };
  }
}