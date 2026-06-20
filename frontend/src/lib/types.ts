export type AgentStatus = "idle" | "routing" | "thinking" | "searching" | "responding" | "done";

export type AgentDomain =
  | "coordinator"
  | "food"
  | "housing"
  | "financial_aid"
  | "scholarship"
  | "wellness"
  | "safety"
  | "academic";

export interface AgentDefinition {
  id: AgentDomain;
  name: string;
  displayName: string;
  port: number;
  color: string;
  icon: string;
  description: string;
  capabilities: string[];
  address?: string;
}

export interface AgentEvent {
  id: string;
  timestamp: number;
  agentId: AgentDomain;
  type: "route" | "query" | "search" | "band" | "response" | "merge" | "info";
  message: string;
  meta?: Record<string, string>;
}

export interface BandEvent {
  agent: string;
  insight: string;
  triggers: string[];
  summary: string;
}

export interface HackResource {
  name: string;
  url: string;
  value: string;
  effort: string;
}

export interface AgentResponse {
  domain: AgentDomain;
  agentName: string;
  summary: string;
  recommendations: string[];
  resources: HackResource[];
  urgency: "low" | "medium" | "high";
}

export interface DemoResult {
  query: string;
  routedDomains: AgentDomain[];
  events: AgentEvent[];
  bandEvents: BandEvent[];
  responses: AgentResponse[];
  mergedPlan: string;
}
