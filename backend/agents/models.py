"""Message models for Jugaad agent-to-agent communication."""

from uagents import Model


class JugaadQuery(Model):
    """Coordinator → specialist request."""

    request_id: str
    user_message: str
    student_profile: dict | None = None


class JugaadResponse(Model):
    """Specialist → coordinator reply."""

    request_id: str
    agent_name: str
    domain: str
    recommendations: list[str]
    resources: list[dict]
    urgency: str = "medium"
    summary: str = ""
