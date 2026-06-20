import type { AgentDefinition } from "./types";

export const AGENTS: AgentDefinition[] = [
  {
    id: "coordinator",
    name: "jugaad-coordinator",
    displayName: "Coordinator",
    port: 8000,
    color: "#FDB515",
    icon: "🎯",
    description: "Receives student problems on Agentverse, routes to specialist hosted agents, and merges responses.",
    capabilities: ["Intent classification", "Multi-agent routing", "Response merging", "Chat protocol handler"],
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
