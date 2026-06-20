"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getAgent } from "@/lib/agents";
import type { AgentEvent } from "@/lib/types";

const TYPE_STYLES: Record<AgentEvent["type"], { icon: string; color: string }> = {
  route: { icon: "→", color: "text-berkeley-gold" },
  query: { icon: "?", color: "text-blue-400" },
  search: { icon: "⌕", color: "text-purple-400" },
  band: { icon: "⚡", color: "text-orange-400" },
  response: { icon: "✓", color: "text-emerald-400" },
  merge: { icon: "◈", color: "text-berkeley-gold" },
  info: { icon: "ℹ", color: "text-muted" },
};

interface AgentActivityFeedProps {
  events: AgentEvent[];
  maxHeight?: string;
  title?: string;
}

export function AgentActivityFeed({
  events,
  maxHeight = "400px",
  title = "Agent Activity Feed",
}: AgentActivityFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  return (
    <div className="glass rounded-2xl overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        <span className="text-xs font-mono text-muted">{events.length} events</span>
      </div>

      <div className="overflow-y-auto p-3 space-y-2 font-mono text-xs" style={{ maxHeight }}>
        <AnimatePresence initial={false}>
          {events.length === 0 ? (
            <p className="text-muted text-center py-8 text-sm font-sans">
              Run a query to see agents collaborate in real time
            </p>
          ) : (
            events.map((event) => {
              const agent = getAgent(event.agentId);
              const style = TYPE_STYLES[event.type];
              const time = new Date(event.timestamp).toLocaleTimeString("en-US", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex gap-2 rounded-lg bg-white/[0.03] px-3 py-2 border border-white/5"
                >
                  <span className="text-muted shrink-0">{time}</span>
                  <span className={`shrink-0 ${style.color}`}>{style.icon}</span>
                  <span className="shrink-0" style={{ color: agent?.color }}>
                    [{agent?.displayName ?? event.agentId}]
                  </span>
                  <span className="text-white/80 break-all">{event.message}</span>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
