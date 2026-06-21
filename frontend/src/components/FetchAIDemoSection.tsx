"use client";

import Link from "next/link";
import { MessageSquare, Radio } from "lucide-react";
import { AGENTS, CROSS_DOMAIN_TRIGGERS } from "@/lib/agents";
import { useAppState } from "@/context/AppStateContext";
import { AgentOrchestrationPanel } from "./AgentOrchestrationPanel";

export function FetchAIDemoSection() {
  const { orchestration } = useAppState();
  const { query, events, mergedResponse, activeAgents, requestId, running } = orchestration;

  const hasActivity = query || events.length > 0 || running;

  return (
    <div className="space-y-8">
      <div className="glass rounded-2xl p-6 sm:p-8 border border-berkeley-gold/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-berkeley-gold/10 border border-berkeley-gold/30 px-3 py-1 text-xs font-mono text-berkeley-gold mb-4">
              MULTI-AGENT ORCHESTRATION
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-white mb-3">
              Watch agents call each other
            </h2>
            <p className="text-muted max-w-2xl text-sm sm:text-base leading-relaxed">
              Synced live with <strong className="text-white">Chat</strong> — ask a question there and
              this page updates in real time with{" "}
              <code className="text-emerald-400/90 text-xs">JUGAAD_QUERY</code> /{" "}
              <code className="text-emerald-400/90 text-xs">JUGAAD_RESPONSE</code> agent messages.
            </p>
          </div>
        </div>

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
        <div className="space-y-4 order-2 lg:order-1">
          <div className="glass rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-mono text-muted uppercase tracking-wider">
                Your question (from Chat)
              </label>
              {running && (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                  <Radio size={12} className="animate-pulse" />
                  LIVE
                </span>
              )}
            </div>

            {query ? (
              <p className="rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white leading-relaxed">
                {query}
              </p>
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center">
                <MessageSquare className="mx-auto h-8 w-8 text-white/20 mb-3" />
                <p className="text-sm text-white/45 mb-4">No question yet</p>
                <Link
                  href="/chat"
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #fdb515, #ffcc55)",
                    color: "#09080f",
                  }}
                >
                  Go to Chat
                </Link>
              </div>
            )}

            {hasActivity && (
              <p className="text-[11px] text-white/35 font-mono">
                Open this tab while chatting — agent messages appear here as Jugaad routes your
                question.
              </p>
            )}
          </div>

          {mergedResponse && (
            <div className="glass rounded-2xl p-4 space-y-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Jugaad Response
              </h4>
              <pre className="text-xs text-white/80 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                {mergedResponse}
              </pre>
            </div>
          )}
        </div>

        <div className="order-1 lg:order-2">
          {hasActivity ? (
            <AgentOrchestrationPanel
              events={events}
              activeAgents={
                activeAgents.length > 0 ? activeAgents : running ? ["coordinator"] : []
              }
              running={running}
              requestId={requestId}
            />
          ) : (
            <div className="glass rounded-2xl p-8 text-center h-full min-h-[320px] flex flex-col items-center justify-center">
              <p className="text-sm text-white/45 max-w-xs">
                Agent network and message trace will appear here when you send a message on Chat.
              </p>
              <Link
                href="/chat"
                className="mt-4 text-sm text-[#fdb515] hover:underline"
              >
                Start chatting →
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="text-lg font-semibold text-white">Agent Registry</h3>
          <p className="text-sm text-muted mt-1">
            Eight specialist agents — one coordinator routes your question to the right domains.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs font-mono text-muted uppercase">
                <th className="px-6 py-3">Agent</th>
                <th className="px-4 py-3">Domain</th>
                <th className="px-4 py-3 hidden lg:table-cell">Agent Address</th>
                <th className="px-4 py-3">Type</th>
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
                  <td className="px-4 py-3 hidden lg:table-cell font-mono text-[10px] text-emerald-400/80">
                    {agent.address ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">Specialist</td>
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

      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Band Cross-Domain Intelligence</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(CROSS_DOMAIN_TRIGGERS).map(([domain, meta]) => {
            const agent = AGENTS.find((a) => a.id === domain);
            return (
              <div key={domain} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
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
