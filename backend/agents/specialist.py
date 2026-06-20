"""Factory for Jugaad specialist uAgents."""

from uagents import Agent, Context

from .config import AgentConfig
from .knowledge import get_domain_response
from .models import JugaadQuery, JugaadResponse
from .protocols import jugaad_protocol


def create_specialist_agent(cfg: AgentConfig) -> Agent:
    agent = Agent(
        name=cfg.name,
        seed=cfg.seed,
        port=cfg.port,
        endpoint=[f"http://127.0.0.1:{cfg.port}/submit"],
        publish_agent_details=True,
        network="testnet",
    )

    @jugaad_protocol.on_message(model=JugaadQuery, replies=JugaadResponse)
    async def handle_query(ctx: Context, sender: str, msg: JugaadQuery) -> None:
        ctx.logger.info(f"[{cfg.name}] Query from {sender}: {msg.user_message[:80]}")
        payload = get_domain_response(cfg.domain, msg.user_message)

        await ctx.send(
            sender,
            JugaadResponse(
                request_id=msg.request_id,
                agent_name=cfg.name,
                domain=cfg.domain,
                recommendations=payload["recommendations"],
                resources=payload["resources"],
                urgency=payload["urgency"],
                summary=payload["summary"],
            ),
        )

    agent.include(jugaad_protocol)
    return agent
