"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { StudentProfile } from "@/lib/api";
import { DEFAULT_PROFILE, type UserSession } from "@/lib/profile";
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
const PROFILE_KEY = "jugaad_student_profile";
const PROFILE_INIT_KEY = "jugaad_profile_initialized";
const USER_KEY = "jugaad_user";
const LEGACY_PROFILE_KEY = "jugaad_profile";

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

function loadProfile(): StudentProfile {
  if (typeof window === "undefined") return { ...DEFAULT_PROFILE };
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
    const legacy = sessionStorage.getItem(LEGACY_PROFILE_KEY);
    if (legacy) return { ...DEFAULT_PROFILE, ...JSON.parse(legacy) };
  } catch {
    // ignore
  }
  return { ...DEFAULT_PROFILE };
}

function loadProfileInitialized(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PROFILE_INIT_KEY) === "true";
}

function loadUser(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as UserSession) : null;
  } catch {
    return null;
  }
}

interface AppStateContextValue {
  chatMessages: ChatMessage[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  orchestration: OrchestrationState;
  setOrchestration: React.Dispatch<React.SetStateAction<OrchestrationState>>;
  resetOrchestration: () => void;
  user: UserSession | null;
  profile: StudentProfile;
  profileInitialized: boolean;
  setProfile: (profile: StudentProfile) => void;
  patchProfile: (patch: Partial<StudentProfile>) => void;
  signIn: (user: UserSession) => void;
  logout: () => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() =>
    typeof window !== "undefined" ? loadChat() : []
  );
  const [orchestration, setOrchestration] = useState<OrchestrationState>(() =>
    typeof window !== "undefined" ? loadOrchestration() : DEFAULT_ORCH
  );
  const [user, setUser] = useState<UserSession | null>(() =>
    typeof window !== "undefined" ? loadUser() : null
  );
  const [profile, setProfileState] = useState<StudentProfile>(() =>
    typeof window !== "undefined" ? loadProfile() : { ...DEFAULT_PROFILE }
  );
  const [profileInitialized, setProfileInitialized] = useState(() =>
    typeof window !== "undefined" ? loadProfileInitialized() : false
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

  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    sessionStorage.setItem(LEGACY_PROFILE_KEY, JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user]);

  const resetOrchestration = useCallback(() => {
    setOrchestration(DEFAULT_ORCH);
  }, []);

  const setProfile = useCallback((next: StudentProfile) => {
    setProfileState(next);
    setProfileInitialized(true);
    localStorage.setItem(PROFILE_INIT_KEY, "true");
  }, []);

  const patchProfile = useCallback((patch: Partial<StudentProfile>) => {
    setProfileState((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
      sessionStorage.setItem(LEGACY_PROFILE_KEY, JSON.stringify(next));
      return next;
    });
    setProfileInitialized(true);
    localStorage.setItem(PROFILE_INIT_KEY, "true");
  }, []);

  const signIn = useCallback((session: UserSession) => {
    setUser(session);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AppStateContext.Provider
      value={{
        chatMessages,
        setChatMessages,
        orchestration,
        setOrchestration,
        resetOrchestration,
        user,
        profile,
        profileInitialized,
        setProfile,
        patchProfile,
        signIn,
        logout,
      }}
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
