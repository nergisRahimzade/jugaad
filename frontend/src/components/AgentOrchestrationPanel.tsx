"use client";

import { AgentActivityFeed } from "./AgentActivityFeed";
import { AgentNetwork } from "./AgentNetwork";
import type { AgentDomain, AgentEvent, AgentStatus } from "@/lib/types";

function statusFromEvent(type: AgentEvent["type"]): AgentStatus {
  switch (type) {
    case "route":
      return "routing";
    case "query":
      return "thinking";
    case "search":
      return "searching";
    case "response":
      return "responding";
    case "merge":
      return "done";
    default:
      return "thinking";
  }
}

function deriveStatuses(events: AgentEvent[]): Partial<Record<AgentDomain, AgentStatus>> {
  const statuses: Partial<Record<AgentDomain, AgentStatus>> = {};
  for (const event of events) {
    statuses[event.agentId] = statusFromEvent(event.type);
  }
  return statuses;
}

interface AgentOrchestrationPanelProps {
  events: AgentEvent[];
  activeAgents: AgentDomain[];
  running?: boolean;
  requestId?: string | null;
  compact?: boolean;
}

export function AgentOrchestrationPanel({
  events,
  activeAgents,
  running = false,
  requestId,
  compact = false,
}: AgentOrchestrationPanelProps) {
  const statuses = deriveStatuses(events);
  const networkAgents: AgentDomain[] = running
    ? ["coordinator", ...activeAgents.filter((a) => a !== "coordinator")]
    : activeAgents.length > 0
      ? (["coordinator", ...activeAgents.filter((a) => a !== "coordinator")] as AgentDomain[])
      : [];

  return (
    <div className={`flex flex-col gap-3 ${compact ? "" : "h-full min-h-0"}`}>
      <div className="glass rounded-2xl p-4 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#fdb515]">
              Agent Network
            </p>
            <p className="text-xs text-white/45 mt-0.5">
              Coordinator → specialists · JugaadQuery/Response wire format
            </p>
          </div>
          {requestId && (
            <span className="text-[10px] font-mono text-white/30 shrink-0">
              req:{requestId}
            </span>
          )}
        </div>
        <AgentNetwork
          activeAgents={networkAgents}
          statuses={statuses}
          highlightCoordinator={running}
        />
      </div>

      <div className={compact ? "" : "flex-1 min-h-0 flex flex-col"}>
        <AgentActivityFeed
          events={events}
          maxHeight={compact ? "240px" : "flex"}
          title="Agent Message Trace"
          highlightProtocol
        />
      </div>
    </div>
  );
}
