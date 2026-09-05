from .calendar_tools import CALENDAR_TOOL_WIRE_NAMES, CalendarTools

# Maps each registered Python tool function name to the wire name shared with the web app.
TOOL_WIRE_NAMES = {
    **CALENDAR_TOOL_WIRE_NAMES,
}

def get_tools(*, token: str, available_tools: list[str] | None = None) -> list:
    tools = []
    if available_tools and "calendar" in available_tools:
        tools += build_calendar_tools(token=token)
    return tools

def build_calendar_tools(*, token: str) -> list:
    tools = CalendarTools(token=token)
    return [
        tools.check_calendar_availability,
        tools.list_calendar_events,
        tools.create_calendar_event,
        tools.reschedule_calendar_event,
        tools.cancel_calendar_event,
    ]