"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AgentDomain, AgentEvent } from "@/lib/types";

export interface ChatMessage {
  role: "assistant" | "user";
  content: string;
  agents?: string[];
}

export interface OrchestrationState {
  query: string | null;
  events: AgentEvent[];
  mergedResponse: string | null;
  activeAgents: AgentDomain[];
  requestId: string | null;
  running: boolean;
}

const CHAT_KEY = "jugaad_chat_messages";
const ORCH_KEY = "jugaad_orchestration";

const DEFAULT_ORCH: OrchestrationState = {
  query: null,
  events: [],
  mergedResponse: null,
  activeAgents: [],
  requestId: null,
  running: false,
};

function loadChat(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(CHAT_KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function loadOrchestration(): OrchestrationState {
  if (typeof window === "undefined") return DEFAULT_ORCH;
  try {
    const raw = sessionStorage.getItem(ORCH_KEY);
    return raw ? { ...DEFAULT_ORCH, ...JSON.parse(raw), running: false } : DEFAULT_ORCH;
  } catch {
    return DEFAULT_ORCH;
  }
}

interface AppStateContextValue {
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  orchestration: OrchestrationState;
  setOrchestration: React.Dispatch<React.SetStateAction<OrchestrationState>>;
  resetOrchestration: () => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() =>
    typeof window !== "undefined" ? loadChat() : []
  );
  const [orchestration, setOrchestration] = useState<OrchestrationState>(() =>
    typeof window !== "undefined" ? loadOrchestration() : DEFAULT_ORCH
  );

  useEffect(() => {
    sessionStorage.setItem(CHAT_KEY, JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    sessionStorage.setItem(
      ORCH_KEY,
      JSON.stringify({ ...orchestration, running: false })
    );
  }, [orchestration]);

  const resetOrchestration = useCallback(() => {
    setOrchestration(DEFAULT_ORCH);
  }, []);

  return (
    <AppStateContext.Provider
      value={{ chatMessages, setChatMessages, orchestration, setOrchestration, resetOrchestration }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
