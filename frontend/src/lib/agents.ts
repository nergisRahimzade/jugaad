import type { AgentDefinition } from "./types";

export const AGENTS: AgentDefinition[] = [
  {
    id: "coordinator",
    name: "jugaad-coordinator",
    displayName: "Coordinator",
    port: 8000,
    color: "#FDB515",
    icon: "🎯",
    description: "Receives student problems, routes to specialist agents, and merges responses.",
    capabilities: ["Intent classification", "Multi-agent routing", "Response merging", "Chat protocol handler"],
    address: "agent1q0coord…jugaad",
  },
  {
    id: "food",
    name: "jugaad-food-agent",
    displayName: "Food Agent",
    port: 8001,
    color: "#34D399",
    icon: "🍎",
    description: "CalFresh stacking strategies, food pantry hours, free food calendar, and real-time surplus network.",
    capabilities: ["CalFresh eligibility", "Pantry stacking", "Surplus matching", "Browserbase live crawl"],
    address: "agent1q0food…8k2m",
  },
  {
    id: "housing",
    name: "jugaad-housing-agent",
    displayName: "Housing Agent",
    port: 8002,
    color: "#60A5FA",
    icon: "🏠",
    description: "BSC co-op discovery, rent control rights, lease red-flag scanning, and emergency bridge housing.",
    capabilities: ["Co-op matching", "Rent control", "Lease analysis", "Emergency housing"],
    address: "agent1q0hous…3n7p",
  },
  {
    id: "financial_aid",
    name: "jugaad-financial-aid-agent",
    displayName: "Financial Aid Agent",
    port: 8003,
    color: "#A78BFA",
    icon: "💰",
    description: "Special Circumstances appeals, emergency loans, fee payment plans, and FAFSA pause guidance.",
    capabilities: ["Appeal drafting", "Emergency loans", "Fee plans", "Aid recalculation"],
    address: "agent1q0fina…9x1q",
  },
  {
    id: "safety",
    name: "jugaad-safety-agent",
    displayName: "Safety Agent",
    port: 8004,
    color: "#F87171",
    icon: "🛡️",
    description: "Real-time walking buddy matching, safe route recommendations, and SafeWalk on-demand.",
    capabilities: ["Buddy matching", "Route analysis", "SafeWalk requests", "Incident data"],
    address: "agent1q0safe…2y3z",
  },
  {
    id: "academic",
    name: "jugaad-academic-agent",
    displayName: "Academic Agent",
    port: 8005,
    color: "#38BDF8",
    icon: "📚",
    description: "Enrollment strategies, BerkeleyTime pattern analysis, study group matching, and prerequisite checks.",
    capabilities: ["Enrollment strategy", "BerkeleyTime data", "Study groups", "Prerequisite check"],
    address: "agent1q0acad…7h4j",
  },
  {
    id: "wellness",
    name: "jugaad-wellness-agent",
    displayName: "Wellness Agent",
    port: 8006,
    color: "#E879F9",
    icon: "🧠",
    description: "Let's Talk drop-ins, SHIP therapist bypass, urgent CAPS pathway, and peer support matching.",
    capabilities: ["Let's Talk finder", "SHIP providers", "Urgent CAPS", "Peer circles"],
    address: "agent1q0well…6t5v",
  },
  {
    id: "scholarship",
    name: "jugaad-scholarship-agent",
    displayName: "Scholarship Agent",
    port: 8007,
    color: "#FB923C",
    icon: "🎓",
    description: "Micro-scholarship scan across departments, cultural centers, and foundations with few applicants.",
    capabilities: ["Micro-scholarship scan", "Deadline tracking", "Essay reuse", "Department awards"],
    address: "agent1q0schl…4w8r",
  },
];

export const CROSS_DOMAIN_TRIGGERS: Record<string, { insight: string; triggers: string[] }> = {
  food: {
    insight: "Food insecurity may indicate unclaimed aid",
    triggers: ["financial_aid", "scholarship"],
  },
  financial_aid: {
    insight: "Financial stress or aid gap detected",
    triggers: ["food", "wellness"],
  },
  academic: {
    insight: "Academic struggle — mental health support recommended",
    triggers: ["wellness", "financial_aid"],
  },
  wellness: {
    insight: "Mental health stress may affect aid eligibility",
    triggers: ["financial_aid"],
  },
  scholarship: {
    insight: "Scholarship search active — check fee payment plan",
    triggers: ["financial_aid"],
  },
  housing: {
    insight: "Housing instability may require emergency aid",
    triggers: ["financial_aid"],
  },
};

export function getAgent(id: string) {
  return AGENTS.find((a) => a.id === id);
}
