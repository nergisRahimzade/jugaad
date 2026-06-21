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
    jugaad_format: bool = False,
) -> str:
    from services.jugaad_format_service import append_jugaad_system_hint, ensure_jugaad_format

    api_system = append_jugaad_system_hint(system) if jugaad_format else system
    with _span(trace_name):
        text = _claude.complete(system=api_system, messages=messages, max_tokens=max_tokens)
        return ensure_jugaad_format(text) if jugaad_format else text


async def logged_stream(
    system: str,
    messages: list[dict],
    max_tokens: int | None,
    trace_name: str,
    jugaad_format: bool = False,
):
    """Async generator that streams Claude output inside a named OTel span."""
    from prompts.jugaad_format import JUGAAD_ASSISTANT_PREFILL
    from services.jugaad_format_service import append_jugaad_system_hint, strip_duplicate_jugaad_one_prefix

    api_system = append_jugaad_system_hint(system) if jugaad_format else system
    with _span(trace_name):
        if jugaad_format:
            yield JUGAAD_ASSISTANT_PREFILL
        prefix_checked = not jugaad_format
        pending = ""
        async for chunk in _claude.stream(system=api_system, messages=messages, max_tokens=max_tokens):
            if prefix_checked:
                yield chunk
                continue
            pending += chunk
            if len(pending) >= len("Jugaad 1:") or "\n" in pending:
                yield strip_duplicate_jugaad_one_prefix(pending)
                pending = ""
                prefix_checked = True
        if pending:
            yield strip_duplicate_jugaad_one_prefix(pending)
