import { eq } from "drizzle-orm";

import { db } from "@/db";
import { googleCalendarAccounts } from "@/db/schema";
import { createGoogleCalendarService } from "./google";
import { decryptToken } from "./encrypt";

export type CalendarEvent = {
  id: string;
  summary: string;
  description?: string;
  start: string; // ISO
  end: string; // ISO
  attendees?: string[];
};

export interface CalendarService {
  checkAvailability(
    start: string,
    end: string,
    timezone: string
  ): Promise<{ available: boolean; conflictingEvents?: CalendarEvent[] }>;
  listEvents(
    from: string,
    to: string,
    timezone: string
  ): Promise<CalendarEvent[]>;
  createEvent(
    input: {
      summary: string;
      description?: string;
      start: string;
      end: string;
      attendees?: string[];
      timezone: string;
    },
    timezone: string
  ): Promise<CalendarEvent>;
  rescheduleEvent(
    eventId: string,
    input: { start: string; end: string; timezone: string }
  ): Promise<CalendarEvent>;
  cancelEvent(eventId: string): Promise<void>;
}

export async function hasGoogleCalendar(userId: string): Promise<boolean> {
  const row = await db
    .select({ id: googleCalendarAccounts.userId })
    .from(googleCalendarAccounts)
    .where(eq(googleCalendarAccounts.userId, userId))
    .limit(1);
  return row.length > 0;
}

export async function getCalendarServiceForUser(userId: string): Promise<CalendarService | null> {

  const rows = await db
    .select()
    .from(googleCalendarAccounts)
    .where(eq(googleCalendarAccounts.userId, userId))
    .limit(1);

  const account = rows[0];

  if (!account?.refreshToken) return null;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;


  let refreshToken: string;
  
  try {
    refreshToken = decryptToken(account.refreshToken);
  } catch {
    return null;
  }

  return createGoogleCalendarService({
    clientId,
    clientSecret,
    refreshToken,
    accessToken: account.accessToken ?? undefined,
    expiresAt: account.tokenExpiresAt?.getTime(),
    calendarId: account.calendarId,
  });
}
