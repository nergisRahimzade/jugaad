"use client";

import { Brain, CheckCircle2, GitBranch, Radio, Search, Sparkles } from "lucide-react";
import { CROSS_DOMAIN_TRIGGERS, getAgent } from "@/lib/agents";
import type { StudentProfile } from "@/lib/api";
import type { AgentDomain, AgentEvent } from "@/lib/types";

const DOMAIN_KEYWORDS: Record<AgentDomain, string[]> = {
  coordinator: [],
  food: ["food", "hungry", "meal", "calfresh", "pantry", "groceries"],
  housing: ["housing", "rent", "lease", "sublet", "homeless", "eviction"],
  financial_aid: ["aid", "fafsa", "sai", "efc", "grant", "tuition", "loan", "bill"],
  scholarship: ["scholarship", "award", "fellowship", "essay", "deadline"],
  wellness: ["stress", "mental", "therapy", "caps", "anxiety", "depressed"],
  safety: ["safe", "safety", "night", "walk", "ucpd", "route"],
  academic: ["class", "course", "grade", "exam", "academic", "tutor", "enroll"],
};

const EVENT_LABELS: Record<AgentEvent["type"], string> = {
  route: "Routing decision",
  query: "Delegated question",
  search: "Evidence lookup",
  band: "Cross-agent signal",
  response: "Specialist response",
  merge: "Final synthesis",
  info: "System note",
};

function matchedKeywords(query: string | null, domain: AgentDomain) {
  if (!query) return [];
  const lower = query.toLowerCase();
  return DOMAIN_KEYWORDS[domain].filter((word) => lower.includes(word));
}

function profileSignals(profile: StudentProfile) {
  const signals: string[] = [];
  if (profile.meal_plan === "none" || profile.meal_plan === "expired") {
    signals.push("No active meal plan");
  }
  if (profile.efc_sai <= 1500) signals.push("Low SAI/EFC");
  if (profile.housing_situation === "unstably-housed") signals.push("Housing instability");
  if (profile.work_hours_per_week >= 15) signals.push(`${profile.work_hours_per_week} work hrs/week`);
  if (profile.current_aid.length > 0) signals.push(`${profile.current_aid.length} aid source(s)`);
  if (profile.major.trim()) signals.push(profile.major);
  return signals.slice(0, 5);
}

interface AgentDecisionPanelProps {
  query: string | null;
  events: AgentEvent[];
  activeAgents: AgentDomain[];
  mergedResponse: string | null;
  running: boolean;
  profile: StudentProfile;
}

export function AgentDecisionPanel({
  query,
  events,
  activeAgents,
  mergedResponse,
  running,
  profile,
}: AgentDecisionPanelProps) {
  const routedAgents = activeAgents.filter((agent) => agent !== "coordinator");
  const profileFacts = profileSignals(profile);
  const latestByAgent = routedAgents.map((agentId) => {
    const agent = getAgent(agentId);
    const lastEvent = [...events].reverse().find((event) => event.agentId === agentId);
    const keywords = matchedKeywords(query, agentId);
    const trigger = CROSS_DOMAIN_TRIGGERS[agentId];

    return {
      agentId,
      agent,
      lastEvent,
      keywords,
      trigger,
    };
  });

  const currentPhase =
    events.length === 0
      ? running
        ? "Classifying request"
        : "Waiting for a query"
      : EVENT_LABELS[events[events.length - 1].type];

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <div className="border-b border-white/5 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#fdb515]">
              Agent Decision Process
            </p>
            <h2 className="mt-1 text-sm font-semibold text-white">{currentPhase}</h2>
          </div>
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border ${
              running
                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                : "border-white/10 bg-white/5 text-white/50"
            }`}
          >
            {running ? <Radio className="h-4 w-4 animate-pulse" /> : <Brain className="h-4 w-4" />}
          </span>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-white">
            <Search className="h-3.5 w-3.5 text-[#fdb515]" />
            Intake Signals
          </div>
          <p className="line-clamp-2 text-xs leading-relaxed text-white/55">
            {query || "Ask a question to watch Jugaad classify need, pick specialists, and merge answers."}
          </p>
          {profileFacts.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {profileFacts.map((signal) => (
                <span
                  key={signal}
                  className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[10px] text-white/55"
                >
                  {signal}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          {latestByAgent.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-white/40">
              Specialist agents will appear here as the coordinator routes the request.
            </div>
          ) : (
            latestByAgent.map(({ agentId, agent, lastEvent, keywords, trigger }) => (
              <div
                key={agentId}
                className="rounded-xl border border-white/8 bg-white/[0.03] p-3"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm"
                    style={{
                      background: `${agent?.color ?? "#fdb515"}22`,
                      border: `1px solid ${agent?.color ?? "#fdb515"}55`,
                    }}
                  >
                    {agent?.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">{agent?.displayName ?? agentId}</p>
                      <span className="text-[10px] font-mono uppercase text-white/35">
                        {lastEvent ? EVENT_LABELS[lastEvent.type] : "Queued"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-white/55">
                      {keywords.length > 0
                        ? `Matched ${keywords.map((word) => `"${word}"`).join(", ")} in the student request.`
                        : agent?.description ?? "Selected by the coordinator for specialist review."}
                    </p>
                    {trigger && (
                      <p className="mt-2 flex items-center gap-1.5 text-[11px] text-white/40">
                        <GitBranch className="h-3 w-3 text-[#fdb515]" />
                        {trigger.insight}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-white">
            {mergedResponse ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-[#fdb515]" />
            )}
            Merge Strategy
          </div>
          <p className="text-xs leading-relaxed text-white/55">
            {mergedResponse
              ? "Coordinator merged specialist outputs into one student-facing action plan, preserving urgent steps first."
              : "The coordinator will rank urgent needs, remove duplicate advice, and return a concise plan."}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <Metric label="Agents" value={String(Math.max(routedAgents.length, running ? 1 : 0))} />
          <Metric label="Events" value={String(events.length)} />
          <Metric label="Status" value={running ? "Live" : mergedResponse ? "Done" : "Idle"} />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/8 bg-black/20 px-2 py-2">
      <p className="text-sm font-semibold text-white">{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/30">{label}</p>
    </div>
  );
}
