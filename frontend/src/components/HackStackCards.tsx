"use client";

import { motion } from "framer-motion";
import { ExternalLink, Clock, Zap } from "lucide-react";
import type { AgentResponse } from "@/lib/types";

const MOCK_STACKS: AgentResponse[] = [
  {
    domain: "food",
    agentName: "jugaad-food-agent",
    summary: "Stack 6 resources for near-zero food budget",
    urgency: "high",
    recommendations: [
      "CalFresh ($292/mo) + MLK pantry weekly + Grab N Go daily",
      "4 campus events with free catering this week",
      "Market Match doubles first $10 at Saturday farmers market",
    ],
    resources: [
      { name: "CalFresh Application", url: "https://basicneeds.berkeley.edu/faq/calfresh", value: "$292/mo", effort: "30 min" },
      { name: "Food Pantry (MLK)", url: "https://basicneeds.berkeley.edu/pantry", value: "Weekly groceries", effort: "Walk-in" },
    ],
  },
  {
    domain: "financial_aid",
    agentName: "jugaad-financial-aid-agent",
    summary: "Bridge FAFSA pause with emergency aid",
    urgency: "high",
    recommendations: [
      "Special Circumstances Appeal — recalculate on current income",
      "Emergency short-term loan while FAFSA processing paused",
      "Fee Payment Plan spreads tuition across semester",
    ],
    resources: [
      { name: "Financial Aid Office", url: "https://financialaid.berkeley.edu", value: "Appeals + loans", effort: "Online form" },
    ],
  },
  {
    domain: "wellness",
    agentName: "jugaad-wellness-agent",
    summary: "Bypass 3-week CAPS wait",
    urgency: "high",
    recommendations: [
      "Let's Talk drop-in — no appointment at multiple locations",
      "SHIP therapist bypass — same-week off-campus openings",
      "24/7 line: 855-817-5667",
    ],
    resources: [
      { name: "CAPS Counseling", url: "https://uhs.berkeley.edu/counseling", value: "Drop-in + urgent", effort: "Walk-in" },
    ],
  },
  {
    domain: "safety",
    agentName: "jugaad-safety-agent",
    summary: "Late-night walking buddy + safe route",
    urgency: "medium",
    recommendations: [
      "2 students leaving Main Stacks in 8 min — join group",
      "Oxford St route: 3 min longer, better lit",
    ],
    resources: [
      { name: "SafeWalk", url: "https://ucpd.berkeley.edu", value: "Free escort", effort: "App request" },
    ],
  },
];

const DOMAIN_META: Record<string, { label: string; color: string; icon: string }> = {
  food: { label: "Food", color: "#34D399", icon: "🍎" },
  financial_aid: { label: "Financial Aid", color: "#A78BFA", icon: "💰" },
  wellness: { label: "Wellness", color: "#E879F9", icon: "🧠" },
  safety: { label: "Safety", color: "#F87171", icon: "🛡️" },
  housing: { label: "Housing", color: "#60A5FA", icon: "🏠" },
  academic: { label: "Academic", color: "#38BDF8", icon: "📚" },
  scholarship: { label: "Scholarship", color: "#FB923C", icon: "🎓" },
};

interface HackStackCardsProps {
  stacks?: AgentResponse[];
}

export function HackStackCards({ stacks = MOCK_STACKS }: HackStackCardsProps) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {stacks.map((stack, i) => {
        const meta = DOMAIN_META[stack.domain] ?? { label: stack.domain, color: "#fff", icon: "📌" };
        const urgent = stack.urgency === "high";

        return (
          <motion.div
            key={stack.domain}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass rounded-2xl p-5 flex flex-col hover:border-white/15 transition group"
            style={{ borderLeftWidth: 3, borderLeftColor: meta.color }}
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{meta.icon}</span>
                <div>
                  <h3 className="font-semibold text-white">{meta.label} Resources</h3>
                  <p className="text-xs text-muted">{stack.summary}</p>
                </div>
              </div>
              {urgent && (
                <span className="shrink-0 rounded-full bg-red-500/20 border border-red-400/30 px-2 py-0.5 text-[10px] font-mono text-red-300">
                  URGENT
                </span>
              )}
            </div>

            <ul className="space-y-2 mb-4 flex-1">
              {stack.recommendations.map((rec) => (
                <li key={rec} className="flex gap-2 text-sm text-white/75">
                  <Zap size={14} className="shrink-0 mt-0.5 text-berkeley-gold" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>

            {stack.resources.map((res) => (
              <a
                key={res.name}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl bg-white/[0.04] border border-white/5 px-3 py-2.5 text-sm hover:bg-white/[0.08] transition group/link"
              >
                <div>
                  <div className="font-medium text-white group-hover/link:text-berkeley-gold transition">
                    {res.name}
                  </div>
                  <div className="flex gap-3 text-xs text-muted mt-0.5">
                    <span>{res.value}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} /> {res.effort}
                    </span>
                  </div>
                </div>
                <ExternalLink size={14} className="text-muted group-hover/link:text-white shrink-0" />
              </a>
            ))}

            <button
              type="button"
              className="mt-3 w-full rounded-xl bg-berkeley-gold/10 border border-berkeley-gold/30 py-2.5 text-sm font-semibold text-berkeley-gold hover:bg-berkeley-gold/20 transition"
            >
              Apply Now — Pre-filled
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}
