import logging
from typing import Any

import httpx

from .settings import settings

logger = logging.getLogger(__name__)

CALL_CONFIG_ENDPOINT = "/api/calls/config"
TOOL_ENDPOINT = "/api/tools"

async def load_call_context(token: str):
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{settings.nextjs_url}{CALL_CONFIG_ENDPOINT}",
                params={"token": token},
            )
            if resp.status_code != 200:
                return None
            config = resp.json()
    except Exception:
        logger.exception("Failed to fetch workflow config")
        return None

    return {
        "system_prompt": config.get("system", ""),
        "language_code": config.get("language") or "en-IN",
        "greeting": config.get("greeting", "Hello! How can I help you?"),
        "available_tools": config.get("availableTools") or [],
    }


async def call_tool(*, token: str, tool: str, args: dict[str, Any]) -> dict[str, Any]:

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{settings.nextjs_url}{TOOL_ENDPOINT}",
                json={"token": token, "tool": tool, "args": args},
            )
        if resp.status_code != 200:
            return {"error": f"Tool failed (HTTP {resp.status_code})"}
        data = resp.json()
        if not data.get("ok"):
            return {"error": data.get("error", "Tool returned error")}
        return {"result": data.get("result")}
    except Exception:
        logger.exception("Tool HTTP call failed")
        return {"error": "Tool service temporarily unavailable"}