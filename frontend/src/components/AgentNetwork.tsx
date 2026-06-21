"use client";

import { motion } from "framer-motion";
import { AGENTS } from "@/lib/agents";
import type { AgentDomain, AgentStatus } from "@/lib/types";

interface AgentNetworkProps {
  activeAgents?: AgentDomain[];
  statuses?: Partial<Record<AgentDomain, AgentStatus>>;
  highlightCoordinator?: boolean;
}

const STATUS_LABEL: Record<AgentStatus, string> = {
  idle: "idle",
  routing: "routing",
  thinking: "processing",
  searching: "searching",
  responding: "responding",
  done: "done",
};

export function AgentNetwork({
  activeAgents = [],
  statuses = {},
  highlightCoordinator = false,
}: AgentNetworkProps) {
  const coordinator = AGENTS.find((a) => a.id === "coordinator")!;
  const specialists = AGENTS.filter((a) => a.id !== "coordinator");

  const isActive = (id: AgentDomain) => activeAgents.includes(id);
  const status = (id: AgentDomain) => statuses[id] ?? (isActive(id) ? "thinking" : "idle");

  const coordinatorActive = highlightCoordinator || isActive("coordinator");
  const coordinatorStatus = status("coordinator");

  return (
    <div className="w-full space-y-3">
      {/* Coordinator hub */}
      <motion.div
        animate={coordinatorActive ? { scale: [1, 1.01, 1] } : {}}
        transition={{ repeat: coordinatorActive ? Infinity : 0, duration: 2 }}
        className="rounded-xl border px-4 py-3 flex items-center gap-3"
        style={{
          borderColor: coordinatorActive ? `${coordinator.color}66` : "rgba(255,255,255,0.08)",
          background: coordinatorActive ? `${coordinator.color}12` : "rgba(255,255,255,0.03)",
          boxShadow: coordinatorActive ? `0 0 24px ${coordinator.color}20` : undefined,
        }}
      >
        <span className="text-2xl shrink-0">{coordinator.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-white">{coordinator.displayName}</span>
            <span className="text-[10px] font-mono text-white/35">:{coordinator.port}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: coordinator.color }}
              initial={{ width: "0%" }}
              animate={{ width: coordinatorActive ? "100%" : "18%" }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
        <StatusPill status={coordinatorStatus} color={coordinator.color} active={coordinatorActive} />
      </motion.div>

      {/* Connector label */}
      <div className="flex items-center gap-2 px-1">
        <div className="h-px flex-1 bg-white/[0.06]" />
        <span className="text-[10px] font-mono uppercase tracking-wider text-white/25 shrink-0">
          routes to
        </span>
        <div className="h-px flex-1 bg-white/[0.06]" />
      </div>

      {/* Specialist bars */}
      <div className="space-y-2">
        {specialists.map((agent, i) => {
          const active = isActive(agent.id);
          const agentStatus = status(agent.id);
          const fillPct = active
            ? agentStatus === "done"
              ? 100
              : agentStatus === "responding"
                ? 90
                : agentStatus === "searching"
                  ? 65
                  : agentStatus === "thinking"
                    ? 45
                    : 30
            : 0;

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-lg border px-3 py-2.5 flex items-center gap-3 transition-colors"
              style={{
                borderColor: active ? `${agent.color}44` : "rgba(255,255,255,0.05)",
                background: active ? `${agent.color}0a` : "rgba(255,255,255,0.02)",
              }}
            >
              <span className="text-lg w-7 text-center shrink-0">{agent.icon}</span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className="text-xs font-medium truncate"
                    style={{ color: active ? agent.color : "rgba(255,255,255,0.55)" }}
                  >
                    {agent.displayName.replace(" Agent", "")}
                  </span>
                  <span className="text-[10px] font-mono text-white/30 shrink-0">:{agent.port}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: active ? agent.color : "rgba(255,255,255,0.12)",
                      boxShadow: active ? `0 0 8px ${agent.color}60` : undefined,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${fillPct}%` }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                  />
                </div>
              </div>

              <StatusPill status={agentStatus} color={agent.color} active={active} compact />
            </motion.div>
          );
        })}
      </div>

      <p className="text-center text-[10px] font-mono text-white/25 pt-1">
        8 agents · coordinator hub · cross-domain routing
      </p>
    </div>
  );
}

function StatusPill({
  status,
  color,
  active,
  compact = false,
}: {
  status: AgentStatus;
  color: string;
  active: boolean;
  compact?: boolean;
}) {
  if (!active && status === "idle") {
    return (
      <span className={`shrink-0 rounded-full bg-white/[0.04] text-white/25 font-mono ${compact ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2 py-0.5"}`}>
        idle
      </span>
    );
  }

  return (
    <span
      className={`shrink-0 rounded-full font-mono capitalize ${compact ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2 py-0.5"} ${status !== "idle" && status !== "done" ? "animate-pulse" : ""}`}
      style={{
        background: `${color}18`,
        color,
        border: `1px solid ${color}44`,
      }}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
