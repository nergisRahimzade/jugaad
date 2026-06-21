import type { StudentProfile } from "./api";

export interface UserSession {
  name: string;
  email: string;
}

export const DEFAULT_PROFILE: StudentProfile = {
  campus: "UC Berkeley",
  enrollment_status: "full-time undergrad",
  efc_sai: 0,
  housing_situation: "off-campus",
  meal_plan: "none",
  citizenship: "US citizen",
  current_aid: [],
  dependents: 0,
  major: "",
  gpa_band: "3.0-3.5",
  work_hours_per_week: 0,
};

export const ENROLLMENT_OPTIONS = [
  "full-time undergrad",
  "part-time",
  "grad",
] as const;

export const HOUSING_OPTIONS = [
  "on-campus",
  "off-campus",
  "unstably-housed",
] as const;

export const MEAL_PLAN_OPTIONS = ["active", "expired", "none"] as const;

export const CITIZENSHIP_OPTIONS = [
  "US citizen",
  "permanent resident",
  "DACA",
  "undocumented",
] as const;

export const GPA_OPTIONS = ["below-2.0", "2.0-3.0", "3.0-3.5", "3.5+"] as const;

export const AID_OPTIONS = [
  "Pell Grant",
  "Cal Grant B",
  "Cal Grant A",
  "Work-Study",
  "Blue and Gold",
  "Middle Class Scholarship",
  "University Grant",
  "None yet",
];

export function profileCompleteness(profile: StudentProfile | null): number {
  if (!profile) return 0;
  const checks = [
    profile.major.trim().length > 0,
    profile.enrollment_status.length > 0,
    profile.housing_situation.length > 0,
    profile.citizenship.length > 0,
    profile.gpa_band.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function mergeProfilePatch(
  profile: StudentProfile,
  patch: Partial<StudentProfile>
): StudentProfile {
  return { ...profile, ...patch };
}

export function userInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
