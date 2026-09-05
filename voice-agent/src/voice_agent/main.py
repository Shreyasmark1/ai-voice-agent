import logging

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from .bot import run_call
from .api_client import load_call_context
from .settings import settings

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="Voice Agent")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    token = ws.query_params.get("token", "")
    ctx = await load_call_context(token)
    if not ctx:
        await ws.close(code=4003)
        return

    await ws.accept()
    try:
        await run_call(ws, token=token, **ctx)
    except Exception:
        logger.exception("Voice call error")
        try:
            await ws.close()
        except Exception:
            pass

def main() -> None:
    uvicorn.run(app, host="0.0.0.0", port=settings.port)

def main_dev() -> None:

    uvicorn.run(
        "voice_agent.main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=True,
        reload_dirs=["src"],
    )