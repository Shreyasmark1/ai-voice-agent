from pathlib import Path
from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings

PROJECT_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = PROJECT_DIR / ".env"

class Settings(BaseSettings):
    port: int
    nextjs_url: str

    llm_api_key: str
    llm_api_endpoint: str
    llm_model: str

    sarvam_api_key: str

    tts_provider: Literal["sarvam", "openai"]
    tts_model: str
    stt_provider: Literal["sarvam", "openai"]
    stt_model: str

    model_config = {"env_file": ENV_FILE, "env_file_encoding": "utf-8"}

    @model_validator(mode="after")
    def _validate(self) -> "Settings":
        if not self.port:
            raise ValueError("PORT is not set")
        if not self.nextjs_url:
            raise ValueError("NEXTJS_URL is not set")
        if not self.llm_api_key:
            raise ValueError("LLM_API_KEY is not set")
        if not self.llm_api_endpoint:
            raise ValueError("LLM_API_ENDPOINT is not set")
        if not self.llm_model:
            raise ValueError("LLM_MODEL is not set")
        if not self.tts_model:
            raise ValueError("TTS_MODEL is not set")

        if self.stt_provider not in ("sarvam", "openai"):
            raise ValueError("STT_PROVIDER must be one of: sarvam, openai")
        if self.tts_provider not in ("sarvam", "openai"):
            raise ValueError("TTS_PROVIDER must be one of: sarvam, openai")

        if (self.stt_provider == "sarvam" or self.tts_provider == "sarvam") and not self.sarvam_api_key:
            raise ValueError("SARVAM_API_KEY is not set")

        if self.stt_provider == "openai" and not self.stt_model:
            raise ValueError("STT_MODEL is not set")

        if self.tts_provider == "openai" and not self.tts_model:
            raise ValueError("TTS_MODEL is not set")

        return self

settings = Settings()
