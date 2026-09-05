from pipecat.services.openai.stt import OpenAISTTService
from pipecat.services.openai.tts import OpenAITTSService
from pipecat.services.openai.llm import OpenAILLMService
# from pipecat.services.openrouter.llm import OpenRouterLLMService
from pipecat.services.sarvam.stt import SarvamSTTService
from pipecat.services.sarvam.tts import SarvamTTSService
from pipecat.transcriptions.language import Language

from .settings import settings

def build_llm(*, system_instruction: str):
    # So the service works with any OpenAI-compatible provider.
    return OpenAILLMService(
        api_key=settings.llm_api_key,
        base_url=settings.llm_api_endpoint,
        settings=OpenAILLMService.Settings(
            model=settings.llm_model,
            system_instruction=system_instruction,
        ),
    )
    # return OpenRouterLLMService(
    #     api_key=settings.llm_api_key,
    #     base_url=settings.llm_api_endpoint,
    #     settings=OpenRouterLLMService.Settings(
    #         model=settings.llm_model,
    #         system_instruction=system_instruction,
    #     ),
    # )

def build_stt(*, language: Language):
    if settings.stt_provider == "sarvam":
        return _sarvam_stt()
    return OpenAISTTService(
        api_key=settings.llm_api_key,
        base_url=settings.llm_api_endpoint,
        settings=OpenAISTTService.Settings(
            model=settings.stt_model,
            language=language,
        ),
    )

def build_tts(*, language: Language):
    if settings.tts_provider == "sarvam":
        return _sarvam_tts(language=language)
    return OpenAITTSService(
        api_key=settings.llm_api_key,
        base_url=settings.llm_api_endpoint,
        settings=OpenAITTSService.Settings(
            model=settings.tts_model,
            voice="alloy",
            language=language,
        ),
    )

def _sarvam_stt():
    return SarvamSTTService(
        api_key=settings.sarvam_api_key,
        mode="transcribe",
        settings=SarvamSTTService.Settings(
            vad_signals=True,
            high_vad_sensitivity=True,
        ),
    )

def _sarvam_tts(*, language: Language):
    return SarvamTTSService(
        api_key=settings.sarvam_api_key,
        settings=SarvamTTSService.Settings(
            model=settings.tts_model,
            voice="shubh",
            language=language,
        ),
    )