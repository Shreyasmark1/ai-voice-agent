from .api_client import call_tool

# Maps each calendar tool function name to the wire name shared with the web app.
CALENDAR_TOOL_WIRE_NAMES = {
    "check_calendar_availability": "calendar-check-availability",
    "list_calendar_events": "calendar-list-events",
    "create_calendar_event": "calendar-create-event",
    "reschedule_calendar_event": "calendar-reschedule-event",
    "cancel_calendar_event": "calendar-cancel-event",
}

class CalendarTools:
    def __init__(self, *, token: str):
        self.token = token

    async def check_calendar_availability(
        self, params, start: str, end: str, timezone: str | None = None
    ):
        """Check whether a time slot is free in the business calendar. Use this BEFORE proposing a booking time to the caller."""
        return await call_tool(
            token=self.token,
            tool="calendar-check-availability",
            args={"start": start, "end": end, "timezone": timezone},
        )

    async def list_calendar_events(self, params, from_: str, to: str, timezone: str | None = None):
        """List events in the business calendar between two datetimes."""
        return await call_tool(
            token=self.token,
            tool="calendar-list-events",
            args={"from": from_, "to": to, "timezone": timezone},
        )

    async def create_calendar_event(
        self,
        params,
        summary: str,
        start: str,
        end: str,
        description: str | None = None,
        attendees: list[str] | None = None,
        timezone: str | None = None,
    ):
        """Book a confirmed event in the business calendar. Only call this after the caller picks an available slot (verified via checkCalendarAvailability)."""
        return await call_tool(
            token=self.token,
            tool="calendar-create-event",
            args={
                "summary": summary,
                "start": start,
                "end": end,
                "description": description,
                "attendees": attendees or [],
                "timezone": timezone,
            },
        )

    async def reschedule_calendar_event(
        self,
        params,
        eventId: str,
        start: str,
        end: str,
        timezone: str | None = None,
    ):
        """Move an existing event to a new time. Check availability of the new slot first."""
        return await call_tool(
            token=self.token,
            tool="calendar-reschedule-event",
            args={
                "eventId": eventId,
                "start": start,
                "end": end,
                "timezone": timezone,
            },
        )

    async def cancel_calendar_event(self, params, eventId: str):
        """Cancel/delete an existing event in the business calendar."""
        return await call_tool(
            token=self.token,
            tool="calendar-cancel-event",
            args={"eventId": eventId},
        )