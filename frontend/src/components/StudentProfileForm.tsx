"use client";

import { StudentProfile } from "@/lib/api";
import {
  AID_OPTIONS,
  CITIZENSHIP_OPTIONS,
  ENROLLMENT_OPTIONS,
  GPA_OPTIONS,
  HOUSING_OPTIONS,
  MEAL_PLAN_OPTIONS,
} from "@/lib/profile";

interface StudentProfileFormProps {
  profile: StudentProfile;
  onChange: (profile: StudentProfile) => void;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-white/70 mb-1.5">{label}</label>
      {hint && <p className="text-[11px] text-white/35 mb-1.5">{hint}</p>}
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#fdb515]/50 transition";

const selectClass = inputClass;

export function StudentProfileForm({ profile, onChange }: StudentProfileFormProps) {
  const set = <K extends keyof StudentProfile>(key: K, value: StudentProfile[K]) =>
    onChange({ ...profile, [key]: value });

  const toggleAid = (aid: string) => {
    const next = profile.current_aid.includes(aid)
      ? profile.current_aid.filter((a) => a !== aid)
      : [...profile.current_aid, aid];
    set("current_aid", next);
  };

  return (
    <div className="space-y-5">
      <Field label="Major" hint="Helps match department scholarships and academic resources">
        <input
          type="text"
          value={profile.major}
          onChange={(e) => set("major", e.target.value)}
          placeholder="e.g. Computer Science"
          className={inputClass}
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Enrollment">
          <select
            value={profile.enrollment_status}
            onChange={(e) => set("enrollment_status", e.target.value)}
            className={selectClass}
          >
            {ENROLLMENT_OPTIONS.map((o) => (
              <option key={o} value={o} className="bg-[#0f0e18]">
                {o}
              </option>
            ))}
          </select>
        </Field>

        <Field label="GPA range">
          <select
            value={profile.gpa_band}
            onChange={(e) => set("gpa_band", e.target.value)}
            className={selectClass}
          >
            {GPA_OPTIONS.map((o) => (
              <option key={o} value={o} className="bg-[#0f0e18]">
                {o}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Housing situation">
          <select
            value={profile.housing_situation}
            onChange={(e) => set("housing_situation", e.target.value)}
            className={selectClass}
          >
            {HOUSING_OPTIONS.map((o) => (
              <option key={o} value={o} className="bg-[#0f0e18]">
                {o.replace(/-/g, " ")}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Meal plan">
          <select
            value={profile.meal_plan}
            onChange={(e) => set("meal_plan", e.target.value)}
            className={selectClass}
          >
            {MEAL_PLAN_OPTIONS.map((o) => (
              <option key={o} value={o} className="bg-[#0f0e18]">
                {o}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Citizenship / immigration status" hint="Affects aid and CalFresh eligibility">
          <select
            value={profile.citizenship}
            onChange={(e) => set("citizenship", e.target.value)}
            className={selectClass}
          >
            {CITIZENSHIP_OPTIONS.map((o) => (
              <option key={o} value={o} className="bg-[#0f0e18]">
                {o}
              </option>
            ))}
          </select>
        </Field>

        <Field label="SAI / EFC ($)" hint="0 = maximum financial need">
          <input
            type="number"
            min={0}
            value={profile.efc_sai}
            onChange={(e) => set("efc_sai", Number(e.target.value) || 0)}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Dependents">
          <input
            type="number"
            min={0}
            value={profile.dependents}
            onChange={(e) => set("dependents", Number(e.target.value) || 0)}
            className={inputClass}
          />
        </Field>

        <Field label="Work hours per week">
          <input
            type="number"
            min={0}
            max={40}
            value={profile.work_hours_per_week}
            onChange={(e) => set("work_hours_per_week", Number(e.target.value) || 0)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Current financial aid" hint="Select all that apply">
        <div className="flex flex-wrap gap-2">
          {AID_OPTIONS.map((aid) => {
            const selected = profile.current_aid.includes(aid);
            return (
              <button
                key={aid}
                type="button"
                onClick={() => toggleAid(aid)}
                className={`rounded-full px-3 py-1.5 text-xs transition border ${
                  selected
                    ? "border-[#fdb515]/50 bg-[#fdb515]/15 text-[#fdb515]"
                    : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white/80"
                }`}
              >
                {aid}
              </button>
            );
          })}
        </div>
      </Field>
    </div>
  );
}
