import json
import logging

from fastapi import WebSocket
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.frames.frames import LLMRunFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.worker import PipelineParams, PipelineWorker, ProcessorUnusablePolicy
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)
from pipecat.serializers.protobuf import MessageFrame, ProtobufFrameSerializer
from pipecat.transcriptions.language import Language
from pipecat.transports.websocket.fastapi import (
    FastAPIWebsocketParams,
    FastAPIWebsocketTransport,
)
from pipecat.workers.runner import WorkerRunner

from .tools import TOOL_WIRE_NAMES, get_tools
from .models import build_llm, build_stt, build_tts

logger = logging.getLogger(__name__)

def _language(language_code: str) -> Language:
    code = (language_code or "en-IN").lower()
    return Language.HI_IN if code.startswith("hi") else Language.EN_IN

async def run_call(
    websocket: WebSocket,
    *,
    system_prompt: str,
    language_code: str,
    greeting: str,
    token: str,
    available_tools: list[str] | None = None,
) -> None:
    lang = _language(language_code)

    transport = FastAPIWebsocketTransport(
        websocket=websocket,
        params=FastAPIWebsocketParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            serializer=ProtobufFrameSerializer(),
        ),
    )

    stt = build_stt(language=lang)
    tts = build_tts(language=lang)
    llm = build_llm(system_instruction=system_prompt)

    context = LLMContext(
        tools=get_tools(
            token=token,
            available_tools=available_tools,
        )
    )
    
    user_aggregator, assistant_aggregator = LLMContextAggregatorPair(
        context,
        user_params=LLMUserAggregatorParams(vad_analyzer=SileroVADAnalyzer()),
    )

    pipeline = Pipeline(
        [
            transport.input(),
            stt,
            user_aggregator,
            llm,
            tts,
            transport.output(),
            assistant_aggregator,
        ]
    )

    worker = PipelineWorker(
        pipeline,
        params=PipelineParams(enable_metrics=False, enable_usage_metrics=False),
        processor_unusable_policy=ProcessorUnusablePolicy.END,
        # setup_timeout_secs=60.0,
        # start_timeout_secs=30.0,
    )

    runner = WorkerRunner(handle_sigint=False, handle_sigterm=False)
    await runner.add_workers(worker)

    # Surface tool executions to the client so the UI can show a small note.
    @llm.event_handler("on_function_calls_started")
    async def on_function_calls_started(service, function_calls):
        for call in function_calls:
            tool = TOOL_WIRE_NAMES.get(call.function_name)
            if tool:
                await transport.output().queue_frame(
                    MessageFrame(
                        data=json.dumps(
                            {
                                "label": "rtvi-ai",
                                "type": "server-message",
                                "data": {"tool": tool},
                            }
                        )
                    )
                )

    @transport.event_handler("on_client_connected")
    async def on_client_connected(_transport, _client):
        logger.info("Call connected, starting conversation")
        context.add_message({"role": "assistant", "content": greeting})
        await worker.queue_frames([LLMRunFrame()])

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(_transport, _client):
        await runner.cancel()

    await runner.run()