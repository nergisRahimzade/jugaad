"""
Arize OTel instrumentation — must be imported before any Anthropic client is created.
Importing this module registers the tracer provider and instruments the Anthropic SDK
so that all messages.create() calls are automatically captured as spans in Arize AX.
"""
from core.config import settings

_initialized = False


def setup():
    global _initialized
    if _initialized:
        return
    if not settings.arize_space_key or not settings.arize_api_key:
        return
    try:
        from arize.otel import register
        from openinference.instrumentation.anthropic import AnthropicInstrumentor

        tracer_provider = register(
            space_id=settings.arize_space_key,
            api_key=settings.arize_api_key,
            project_name="jugaad",
        )
        AnthropicInstrumentor().instrument(tracer_provider=tracer_provider)
        _initialized = True
    except Exception:
        pass  # Never break the app if Arize setup fails
