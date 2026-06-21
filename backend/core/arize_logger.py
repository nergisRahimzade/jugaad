"""
Arize observability wrappers.
Auto-instrumentation (via AnthropicInstrumentor) captures every Anthropic SDK call.
These wrappers add named parent spans so each call appears in Arize AX under its
trace_name (e.g. "intake", "hack_stack_food", "apply_now_grant").
"""
import core.claude_client as _claude

try:
    from opentelemetry import trace as _otel_trace
    _tracer = _otel_trace.get_tracer("jugaad")
except Exception:
    _tracer = None


def _span(name: str):
    """Return a context manager span, or a no-op if OTel isn't available."""
    if _tracer:
        return _tracer.start_as_current_span(name)
    from contextlib import nullcontext
    return nullcontext()


def logged_complete(
    system: str,
    messages: list[dict],
    max_tokens: int | None,
    trace_name: str,
) -> str:
    with _span(trace_name):
        return _claude.complete(system=system, messages=messages, max_tokens=max_tokens)


async def logged_stream(
    system: str,
    messages: list[dict],
    max_tokens: int | None,
    trace_name: str,
):
    """Async generator that streams Claude output inside a named OTel span."""
    with _span(trace_name):
        async for chunk in _claude.stream(system=system, messages=messages, max_tokens=max_tokens):
            yield chunk
