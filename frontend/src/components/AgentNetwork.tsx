"use client";

import { motion } from "framer-motion";
import { AGENTS } from "@/lib/agents";
import type { AgentDomain, AgentStatus } from "@/lib/types";

interface AgentNetworkProps {
  activeAgents?: AgentDomain[];
  statuses?: Partial<Record<AgentDomain, AgentStatus>>;
  highlightCoordinator?: boolean;
}

export function AgentNetwork({
  activeAgents = [],
  statuses = {},
  highlightCoordinator = false,
}: AgentNetworkProps) {
  const coordinator = AGENTS.find((a) => a.id === "coordinator")!;
  const specialists = AGENTS.filter((a) => a.id !== "coordinator");

  const isActive = (id: AgentDomain) => activeAgents.includes(id);
  const status = (id: AgentDomain) => statuses[id] ?? (isActive(id) ? "thinking" : "idle");

  const statusColor: Record<AgentStatus, string> = {
    idle: "bg-white/10 border-white/10",
    routing: "bg-berkeley-gold/20 border-berkeley-gold/50 animate-pulse",
    thinking: "bg-blue-500/20 border-blue-400/50 animate-pulse",
    searching: "bg-purple-500/20 border-purple-400/50 animate-pulse",
    responding: "bg-emerald-500/20 border-emerald-400/50 animate-pulse",
    done: "bg-emerald-500/10 border-emerald-400/30",
  };

  return (
    <div className="relative w-full aspect-square max-w-lg mx-auto">
      {/* Connection lines SVG */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400">
        {specialists.map((agent, i) => {
          const angle = (i / specialists.length) * Math.PI * 2 - Math.PI / 2;
          const x = 200 + Math.cos(angle) * 140;
          const y = 200 + Math.sin(angle) * 140;
          const active = isActive(agent.id);
          return (
            <line
              key={agent.id}
              x1="200"
              y1="200"
              x2={x}
              y2={y}
              stroke={active ? agent.color : "rgba(255,255,255,0.06)"}
              strokeWidth={active ? 2 : 1}
              strokeDasharray={active ? "none" : "4 4"}
              opacity={active ? 0.8 : 0.4}
            />
          );
        })}
      </svg>

      {/* Coordinator center */}
      <motion.div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10`}
        animate={highlightCoordinator || isActive("coordinator") ? { scale: [1, 1.05, 1] } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <div
          className={`flex flex-col items-center gap-1 rounded-2xl border-2 px-4 py-3 min-w-[100px] ${statusColor[status("coordinator")]}`}
          style={{ borderColor: coordinator.color + "80" }}
        >
          <span className="text-2xl">{coordinator.icon}</span>
          <span className="text-xs font-semibold text-white">{coordinator.displayName}</span>
          <span className="text-[10px] font-mono text-muted">:8000</span>
        </div>
      </motion.div>

      {/* Specialist nodes */}
      {specialists.map((agent, i) => {
        const angle = (i / specialists.length) * Math.PI * 2 - Math.PI / 2;
        const x = 50 + Math.cos(angle) * 35;
        const y = 50 + Math.sin(angle) * 35;
        const active = isActive(agent.id);

        return (
          <motion.div
            key={agent.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: active ? 1.08 : 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <div
              className={`flex flex-col items-center gap-0.5 rounded-xl border px-2.5 py-2 min-w-[72px] transition-all ${statusColor[status(agent.id)]}`}
              style={active ? { boxShadow: `0 0 20px ${agent.color}40` } : {}}
            >
              <span className="text-lg">{agent.icon}</span>
              <span className="text-[10px] font-medium text-white text-center leading-tight">
                {agent.displayName.replace(" Agent", "")}
              </span>
              <span className="text-[9px] font-mono text-muted">:{agent.port}</span>
            </div>
          </motion.div>
        );
      })}

      {/* Fetch.ai badge */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 glass rounded-full px-4 py-1.5 text-[10px] font-mono text-muted whitespace-nowrap">
        Fetch.ai uAgents · Bureau · Agentverse · testnet
      </div>
    </div>
  );
}
