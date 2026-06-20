"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Play, RotateCcw, ExternalLink, Copy, Check } from "lucide-react";
import { AGENTS, CROSS_DOMAIN_TRIGGERS } from "@/lib/agents";
import { DEMO_QUERIES, simulateDemo } from "@/lib/demo-simulator";
import { AgentNetwork } from "./AgentNetwork";
import { AgentActivityFeed } from "./AgentActivityFeed";
import type { AgentDomain, AgentEvent, DemoResult } from "@/lib/types";

export function FetchAIDemoSection() {
  const [query, setQuery] = useState(DEMO_QUERIES[0].query);
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [copied, setCopied] = useState(false);

  const activeAgents: AgentDomain[] = result
    ? ["coordinator", ...result.routedDomains]
    : running
      ? ["coordinator"]
      : [];

  const runDemo = useCallback(async () => {
    setRunning(true);
    setEvents([]);
    setResult(null);

    const res = await simulateDemo(query, (event) => {
      setEvents((prev) => [...prev, event]);
    });

    setResult(res);
    setRunning(false);
  }, [query]);

  const copyCommand = () => {
    navigator.clipboard.writeText(`python -m agents.demo_client "${query}"`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header for judges */}
      <div className="glass rounded-2xl p-6 sm:p-8 border border-berkeley-gold/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-berkeley-gold/10 border border-berkeley-gold/30 px-3 py-1 text-xs font-mono text-berkeley-gold mb-4">
              FETCH.AI SPONSOR DEMO
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-white mb-3">
              8 uAgents on Agentverse
            </h2>
            <p className="text-muted max-w-2xl text-sm sm:text-base leading-relaxed">
              <strong className="text-white">Fetch.ai uAgents</strong> with mailbox protocol,
              a <strong className="text-white">Bureau</strong> runner for 8 agents, and{" "}
              <strong className="text-white">Band</strong> shared rooms for cross-domain intelligence.
              Real agent-to-agent messaging on testnet.
            </p>
          </div>
          <a
            href="https://agentverse.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-muted hover:text-white hover:border-white/20 transition"
          >
            Agentverse <ExternalLink size={14} />
          </a>
        </div>

        {/* Architecture flow */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
          {[
            { step: "1", label: "User Query", sub: "ChatMessage protocol" },
            { step: "2", label: "Coordinator Routes", sub: "JugaadQuery → specialists" },
            { step: "3", label: "Band Cross-Trigger", sub: "Shared room context" },
            { step: "4", label: "Merged Plan", sub: "JugaadResponse → user" },
          ].map(({ step, label, sub }) => (
            <div key={step} className="rounded-xl bg-white/[0.03] border border-white/5 p-3">
              <div className="text-berkeley-gold font-mono font-bold text-lg">{step}</div>
              <div className="text-white font-medium mt-1">{label}</div>
              <div className="text-muted mt-0.5">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Network + controls */}
        <div className="space-y-4">
          <div className="glass rounded-2xl p-6">
            <AgentNetwork
              activeAgents={activeAgents}
              highlightCoordinator={running}
            />
          </div>

          {/* Query input */}
          <div className="glass rounded-2xl p-4 space-y-3">
            <label className="text-xs font-mono text-muted uppercase tracking-wider">
              Demo Query (routes via keyword + cross-domain triggers)
            </label>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={2}
              className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-muted/50 focus:outline-none focus:border-berkeley-gold/50 resize-none"
              placeholder="Describe your problem…"
            />

            <div className="flex flex-wrap gap-2">
              {DEMO_QUERIES.map(({ label, query: q }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setQuery(q)}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-muted hover:text-white hover:border-white/20 transition"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={runDemo}
                disabled={running || !query.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-berkeley-gold py-3 text-sm font-semibold text-berkeley-blue disabled:opacity-50 hover:bg-[#ffc940] transition"
              >
                {running ? (
                  <>
                    <span className="h-4 w-4 border-2 border-berkeley-blue/30 border-t-berkeley-blue rounded-full animate-spin" />
                    Agents running…
                  </>
                ) : (
                  <>
                    <Play size={16} /> Run Agent Demo
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => { setEvents([]); setResult(null); }}
                className="rounded-xl border border-white/10 px-4 py-3 text-muted hover:text-white transition"
                aria-label="Reset"
              >
                <RotateCcw size={16} />
              </button>
            </div>

            {/* CLI command for judges */}
            <div className="rounded-xl bg-black/40 border border-white/5 p-3 flex items-center gap-2">
              <code className="flex-1 text-[11px] font-mono text-emerald-400/90 truncate">
                python -m agents.demo_client &quot;{query.slice(0, 40)}{query.length > 40 ? "…" : ""}&quot;
              </code>
              <button type="button" onClick={copyCommand} className="text-muted hover:text-white shrink-0">
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Activity feed + result */}
        <div className="space-y-4">
          <AgentActivityFeed events={events} maxHeight="280px" />

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-4 space-y-3"
            >
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Merged Response
              </h4>
              <pre className="text-xs text-white/80 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                {result.mergedPlan}
              </pre>
            </motion.div>
          )}
        </div>
      </div>

      {/* Agent registry table — for Agentverse verification */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="text-lg font-semibold text-white">Agent Registry</h3>
          <p className="text-sm text-muted mt-1">
            Register with <code className="text-berkeley-gold font-mono text-xs">python -m agents.register_agents</code> — judges verify on Agentverse
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs font-mono text-muted uppercase">
                <th className="px-6 py-3">Agent</th>
                <th className="px-4 py-3">Domain</th>
                <th className="px-4 py-3">Port</th>
                <th className="px-4 py-3 hidden md:table-cell">Capabilities</th>
                <th className="px-4 py-3">Protocol</th>
              </tr>
            </thead>
            <tbody>
              {AGENTS.map((agent) => (
                <tr key={agent.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <span>{agent.icon}</span>
                      <div>
                        <div className="font-medium text-white">{agent.displayName}</div>
                        <div className="text-[10px] font-mono text-muted">{agent.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: agent.color }}>
                    {agent.id}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">:{agent.port}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {agent.capabilities.slice(0, 2).map((c) => (
                        <span key={c} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-muted">
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {agent.id === "coordinator" ? "Chat + Jugaad" : "JugaadQuery/Response"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Band cross-domain triggers */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Band Cross-Domain Intelligence</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(CROSS_DOMAIN_TRIGGERS).map(([domain, meta]) => {
            const agent = AGENTS.find((a) => a.id === domain);
            return (
              <div
                key={domain}
                className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span>{agent?.icon}</span>
                  <span className="text-sm font-medium text-white capitalize">
                    {domain.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-xs text-muted mb-2">{meta.insight}</p>
                <div className="flex flex-wrap gap-1">
                  {meta.triggers.map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2 py-0.5 text-[10px] font-mono border border-orange-400/30 text-orange-300 bg-orange-400/10"
                    >
                      → {t}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
