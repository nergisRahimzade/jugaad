/**
 * Jugaad backend API client.
 * Base URL defaults to localhost:8000 in dev; set NEXT_PUBLIC_API_URL in production.
 */

import type { AgentEvent } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

export type CoordinatorStreamEvent =
  | {
      type: "meta";
      agents: string[];
      requestId?: string;
      missingProfileFields?: string[];
      profileCompleteness?: number;
      profilePatch?: Partial<StudentProfile>;
    }
  | { type: "agent_event"; event: Omit<AgentEvent, "id" | "timestamp"> }
  | { type: "chunk"; text: string };

async function* readSseStream(
  res: Response,
  parseMetaJson = false
): AsyncGenerator<string | CoordinatorStreamEvent> {
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      if (buffer.trim()) {
        for (const line of buffer.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") return;
        if (parseMetaJson && payload.startsWith("{")) {
          try {
            const parsed = JSON.parse(payload) as {
              type?: string;
              agents?: string[];
              requestId?: string;
              missingProfileFields?: string[];
              profileCompleteness?: number;
              profilePatch?: Partial<StudentProfile>;
              event?: Omit<AgentEvent, "id" | "timestamp">;
            };
            if (parsed.type === "meta" && parsed.agents) {
              yield {
                type: "meta",
                agents: parsed.agents,
                requestId: parsed.requestId,
                missingProfileFields: parsed.missingProfileFields,
                profileCompleteness: parsed.profileCompleteness,
                profilePatch: parsed.profilePatch,
              };
              continue;
            }
            if (parsed.type === "agent_event" && parsed.event) {
              yield { type: "agent_event", event: parsed.event };
              continue;
            }
          } catch {
            // fall through
          }
        }
          yield payload;
        }
      }
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      for (const line of part.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6);
        if (payload === "[DONE]") return;

        if (parseMetaJson && payload.startsWith("{")) {
          try {
            const parsed = JSON.parse(payload) as {
              type?: string;
              agents?: string[];
              requestId?: string;
              missingProfileFields?: string[];
              profileCompleteness?: number;
              profilePatch?: Partial<StudentProfile>;
              event?: Omit<AgentEvent, "id" | "timestamp">;
            };
            if (parsed.type === "meta" && parsed.agents) {
              yield {
                type: "meta",
                agents: parsed.agents,
                requestId: parsed.requestId,
                missingProfileFields: parsed.missingProfileFields,
                profileCompleteness: parsed.profileCompleteness,
                profilePatch: parsed.profilePatch,
              };
              continue;
            }
            if (parsed.type === "agent_event" && parsed.event) {
              yield { type: "agent_event", event: parsed.event };
              continue;
            }
          } catch {
            // fall through as text chunk
          }
        }

        yield payload;
      }
    }
  }
}

export interface StudentProfile {
  campus: string;
  enrollment_status: string;
  efc_sai: number;
  housing_situation: string;
  meal_plan: string;
  citizenship: string;
  current_aid: string[];
  dependents: number;
  major: string;
  gpa_band: string;
  work_hours_per_week: number;
}

export interface IntakeStartResponse {
  session_id: string;
  message: string;
  is_complete: boolean;
  questions_asked: number;
}

export interface IntakeContinueResponse {
  message: string;
  is_complete: boolean;
  profile: StudentProfile | null;
  questions_asked: number;
}

export interface HackItem {
  id: string;
  name: string;
  domain: string;
  description: string;
  how_to_access: string;
  url: string | null;
  phone: string | null;
  dollar_value: string | null;
  effort_level: string;
  citizenship_required: string[];
  deadline: string | null;
}

export interface HackStack {
  domain: string;
  narrative: string;
  hacks: HackItem[];
  stacking_tip: string;
  total_value: string | null;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }
  return res.json();
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

async function postForm<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }
  return res.json();
}

export const api = {
  intakeStart: (): Promise<IntakeStartResponse> => post("/intake/start", {}),

  intakeContinue: (
    session_id: string,
    answer: string
  ): Promise<IntakeContinueResponse> =>
    post("/intake/continue", { session_id, answer }),

  recommend: (
    profile: StudentProfile,
    problem_description: string
  ): Promise<HackStack> => post("/recommend", { profile, problem_description }),

  applyNow: (
    profile: StudentProfile,
    hack_id: string
  ): Promise<{ content: string; content_type: string; hack: HackItem }> =>
    post("/apply-now", { profile, hack_id }),

  calfreshCheck: (
    profile: StudentProfile | null,
    messages: { role: string; content: string }[],
    message: string
  ): Promise<{
    message: string;
    eligibility_determined: boolean;
    likely_eligible: boolean | null;
    next_steps: string[] | null;
  }> => post("/calfresh-check", { profile, messages, message }),

  checklist: (
    profile: StudentProfile
  ): Promise<{ checklist: string; profile: StudentProfile }> =>
    post("/checklist", { profile }),

  deadlines: (
    profile: StudentProfile,
    email?: string
  ): Promise<{
    alerts: { hack_id: string; hack_name: string; domain: string; deadline: string; days_until: number | null; urgency: string; dollar_value: string | null; url: string | null; effort_level: string }[];
    grouped: Record<string, unknown[]>;
    total: number;
    urgent_count: number;
    email_sent: boolean;
  }> => post("/deadlines", { profile, email }),

  demoMaria: (): Promise<{ profile: StudentProfile; persona: string }> =>
    get("/demo/maria"),

  transcribeAudio: async (audio: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append("file", audio, "recording.webm");
    const data = await postForm<{ transcript: string }>("/speech/transcribe", formData);
    return data.transcript;
  },

  synthesizeSpeech: async (text: string): Promise<Blob> => {
    const res = await fetch(`${BASE_URL}/speech/synthesize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API error ${res.status}: ${err}`);
    }
    return res.blob();
  },

  streamChat: async function* (
    message: string,
    messages: { role: string; content: string }[],
    options?: {
      profile?: StudentProfile | null;
      profileInitialized?: boolean;
      domain?: string;
    }
  ): AsyncGenerator<string | CoordinatorStreamEvent> {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        messages,
        profile: options?.profile ?? null,
        profile_initialized: options?.profileInitialized ?? false,
        domain: options?.domain ?? null,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API error ${res.status}: ${err}`);
    }

    for await (const event of readSseStream(res, true)) {
      if (typeof event === "string") {
        yield { type: "chunk", text: event };
      } else {
        yield event;
      }
    }
  },

  streamCoordinator: async function* (
    message: string,
    messages: { role: string; content: string }[],
    options?: { profile?: StudentProfile | null; profileInitialized?: boolean }
  ): AsyncGenerator<CoordinatorStreamEvent> {
    const res = await fetch(`${BASE_URL}/chat/coordinator`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        messages,
        profile: options?.profile ?? null,
        profile_initialized: options?.profileInitialized ?? false,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API error ${res.status}: ${err}`);
    }

    for await (const event of readSseStream(res, true)) {
      if (typeof event === "string") {
        yield { type: "chunk", text: event };
      } else {
        yield event;
      }
    }
  },
};
