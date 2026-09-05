import type { CalendarEvent, CalendarService } from "./index";
import { GOOGLE_CALENDAR_BASE, GOOGLE_OAUTH_TOKEN_URL } from "@/lib/constants";

type GoogleCalendarCredentials = {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accessToken?: string;
  expiresAt?: number;
  calendarId?: string;
};

type GCalEvent = {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  attendees?: { email: string }[];
};

type Ctx = {
  creds: GoogleCalendarCredentials;
  base: string;
  cached: { token: string; expiresAt: number } | null;
};

function mapEvent(g: GCalEvent): CalendarEvent {
  return {
    id: g.id,
    summary: g.summary ?? "(untitled)",
    description: g.description,
    start: g.start?.dateTime ?? g.start?.date ?? "",
    end: g.end?.dateTime ?? g.end?.date ?? "",
    attendees: g.attendees?.map((a) => a.email),
  };
}

function calendarId(creds: GoogleCalendarCredentials): string {
  return creds.calendarId || "primary";
}

async function getAccessToken(ctx: Ctx): Promise<string> {
  const { creds } = ctx;
  const now = Date.now();
  if (ctx.cached && ctx.cached.expiresAt > now + 60_000) {
    return ctx.cached.token;
  }

  const res = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      refresh_token: creds.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Failed to obtain Google access token (${res.status}): ${res.status === 400 ? "invalid_grant" : ""} ${await res.text()}`
    );
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  ctx.cached = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

async function authedFetch(ctx: Ctx, path: string, init: RequestInit = {}) {
  const token = await getAccessToken(ctx);
  const res = await fetch(`${GOOGLE_CALENDAR_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    throw new Error(`Google Calendar API error ${res.status}: ${await res.text()}`);
  }

  return res.status === 204 ? null : res.json();
}

async function checkAvailability(ctx: Ctx, start: string, end: string, timezone: string) {
  const events = await listEvents(ctx, start, end, timezone);
  const overlapping = events.filter(
    (ev) =>
      Date.parse(ev.start) < Date.parse(end) &&
      Date.parse(ev.end) > Date.parse(start)
  );
  return { available: overlapping.length === 0, conflictingEvents: overlapping };
}

async function listEvents(ctx: Ctx, from: string, to: string, timezone: string) {
  const params = new URLSearchParams({
    timeMin: new Date(from).toISOString(),
    timeMax: new Date(to).toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
  });
  if (timezone) params.set("timeZone", timezone);
  const data = (await authedFetch(
    ctx,
    `${ctx.base}/events?${params.toString()}`
  )) as { items?: GCalEvent[] };
  return (data.items ?? []).map(mapEvent);
}

async function createEvent(
  ctx: Ctx,
  input: {
    summary: string;
    description?: string;
    start: string;
    end: string;
    attendees?: string[];
    timezone: string;
  }
) {
  const body = {
    summary: input.summary,
    description: input.description,
    start: { dateTime: new Date(input.start).toISOString(), timeZone: input.timezone },
    end: { dateTime: new Date(input.end).toISOString(), timeZone: input.timezone },
    attendees: input.attendees?.map((email) => ({ email })),
  };
  return mapEvent((await authedFetch(ctx, `${ctx.base}/events`, {
    method: "POST",
    body: JSON.stringify(body),
  })) as GCalEvent);
}

async function rescheduleEvent(
  ctx: Ctx,
  eventId: string,
  input: { start: string; end: string; timezone: string }
) {
  const body = {
    start: { dateTime: new Date(input.start).toISOString(), timeZone: input.timezone },
    end: { dateTime: new Date(input.end).toISOString(), timeZone: input.timezone },
  };
  return mapEvent(
    (await authedFetch(
      ctx,
      `${ctx.base}/events/${encodeURIComponent(eventId)}`,
      { method: "PATCH", body: JSON.stringify(body) }
    )) as GCalEvent
  );
}

async function cancelEvent(ctx: Ctx, eventId: string) {
  await authedFetch(ctx, `${ctx.base}/events/${encodeURIComponent(eventId)}`, {
    method: "DELETE",
  });
}

export function createGoogleCalendarService(
  creds: GoogleCalendarCredentials
): CalendarService {
  const ctx: Ctx = {
    creds,
    base: `/calendars/${encodeURIComponent(calendarId(creds))}`,
    cached: creds.accessToken
      ? { token: creds.accessToken, expiresAt: creds.expiresAt ?? 0 }
      : null,
  };

  return {
    checkAvailability: (start, end, timezone) => checkAvailability(ctx, start, end, timezone),
    listEvents: (from, to, timezone) => listEvents(ctx, from, to, timezone),
    createEvent: (input) => createEvent(ctx, input),
    rescheduleEvent: (eventId, input) => rescheduleEvent(ctx, eventId, input),
    cancelEvent: (eventId) => cancelEvent(ctx, eventId),
  };
}
