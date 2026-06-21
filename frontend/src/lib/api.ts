/**
 * Jugaad backend API client.
 * Base URL defaults to localhost:8000 in dev; set NEXT_PUBLIC_API_URL in production.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

  demoMaria: (): Promise<{ profile: StudentProfile; persona: string }> =>
    get("/demo/maria"),

  transcribeAudio: async (audio: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append("file", audio, "recording.webm");
    const data = await postForm<{ transcript: string }>("/speech/transcribe", formData);
    return data.transcript;
  },
};
