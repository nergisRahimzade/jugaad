"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, ExternalLink, Sparkles } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { profileCompleteness } from "@/lib/profile";

type ResourceSectionId =
  | "food"
  | "housing"
  | "financial_aid"
  | "academic"
  | "wellness"
  | "safety"
  | "scholarship";

interface ResourceItem {
  name: string;
  description: string;
  action: string;
  url: string;
  effort: "Fast" | "Medium" | "High";
  deadline?: string;
  fit: string[];
}

interface ResourceSection {
  id: ResourceSectionId;
  title: string;
  accent: string;
  summary: string;
  items: ResourceItem[];
}

const SECTIONS: ResourceSection[] = [
  {
    id: "food",
    title: "Food + CalFresh",
    accent: "#34d399",
    summary: "Immediate meal access, grocery support, and pantry stacking.",
    items: [
      {
        name: "UC Berkeley Basic Needs Food Pantry",
        description: "Free groceries and hygiene items for Berkeley students.",
        action: "Check hours and bring Cal 1 Card",
        url: "https://basicneeds.berkeley.edu/pantry",
        effort: "Fast",
        fit: ["meal_plan:none", "meal_plan:expired", "efc_low"],
      },
      {
        name: "CalFresh Student Eligibility",
        description: "Monthly grocery benefits for eligible students.",
        action: "Pre-screen and prepare documents",
        url: "https://basicneeds.berkeley.edu/calfresh",
        effort: "Medium",
        fit: ["efc_low", "citizenship:US citizen", "citizenship:permanent resident"],
      },
      {
        name: "Cal Dining Meal Swipe Assistance",
        description: "Short-term meal support when dining access runs out.",
        action: "Ask Basic Needs for meal assistance",
        url: "https://basicneeds.berkeley.edu",
        effort: "Fast",
        fit: ["meal_plan:expired", "meal_plan:none"],
      },
    ],
  },
  {
    id: "housing",
    title: "Housing Stability",
    accent: "#60a5fa",
    summary: "Emergency housing, tenant support, and lower-cost Berkeley options.",
    items: [
      {
        name: "Basic Needs Emergency Housing",
        description: "Rapid support for students without a safe place to stay.",
        action: "Request a housing consult",
        url: "https://basicneeds.berkeley.edu",
        effort: "Fast",
        fit: ["housing_situation:unstably-housed"],
      },
      {
        name: "Berkeley Student Cooperative",
        description: "Lower-cost co-op housing and board plans near campus.",
        action: "Check openings and waitlist",
        url: "https://bsc.coop",
        effort: "Medium",
        fit: ["housing_situation:off-campus", "efc_low"],
      },
      {
        name: "Student Legal Services",
        description: "Lease, deposit, and tenant-rights guidance for students.",
        action: "Book a tenant-rights appointment",
        url: "https://sa.berkeley.edu/legal",
        effort: "Medium",
        fit: ["housing_situation:off-campus", "housing_situation:unstably-housed"],
      },
    ],
  },
  {
    id: "financial_aid",
    title: "Financial Aid + Emergency Money",
    accent: "#a78bfa",
    summary: "Appeals, emergency loans, aid adjustments, and payment plans.",
    items: [
      {
        name: "Financial Aid Special Circumstances Appeal",
        description: "Ask Berkeley to recalculate aid after income or family changes.",
        action: "Draft appeal context",
        url: "https://financialaid.berkeley.edu",
        effort: "High",
        fit: ["efc_low", "work_high"],
      },
      {
        name: "Emergency Loan Program",
        description: "Short-term funds for urgent student expenses.",
        action: "Check loan eligibility",
        url: "https://financialaid.berkeley.edu/types-of-aid-at-berkeley/loans/emergency-loans/",
        effort: "Medium",
        fit: ["efc_low", "housing_situation:unstably-housed"],
      },
      {
        name: "Fee Payment Plan",
        description: "Split registration fees into installments.",
        action: "Compare payment plan timing",
        url: "https://studentbilling.berkeley.edu",
        effort: "Fast",
        fit: ["work_high", "current_aid"],
      },
    ],
  },
  {
    id: "academic",
    title: "Academic Recovery",
    accent: "#38bdf8",
    summary: "Tutoring, enrollment strategy, DSP support, and course planning.",
    items: [
      {
        name: "Student Learning Center",
        description: "Tutoring, study groups, writing, and course support.",
        action: "Find support for current classes",
        url: "https://slc.berkeley.edu",
        effort: "Fast",
        fit: ["major", "gpa_low"],
      },
      {
        name: "College Advising",
        description: "Academic planning, late drops, reduced course load, and graduation checks.",
        action: "Book advising appointment",
        url: "https://lsadvising.berkeley.edu",
        effort: "Medium",
        fit: ["gpa_low", "work_high"],
      },
      {
        name: "DSP Accommodations",
        description: "Academic accommodations for disability, health, and access needs.",
        action: "Review DSP intake",
        url: "https://dsp.berkeley.edu",
        effort: "Medium",
        fit: ["work_high"],
      },
    ],
  },
  {
    id: "wellness",
    title: "Wellness + Mental Health",
    accent: "#e879f9",
    summary: "CAPS, urgent counseling, peer support, and lower-friction care.",
    items: [
      {
        name: "CAPS Counseling",
        description: "Short-term counseling and mental health referrals through Tang.",
        action: "Schedule a CAPS appointment",
        url: "https://uhs.berkeley.edu/counseling",
        effort: "Medium",
        fit: ["work_high", "housing_situation:unstably-housed", "gpa_low"],
      },
      {
        name: "Let's Talk Drop-in Consultations",
        description: "Informal, no-commitment conversations with counselors.",
        action: "Find a drop-in time",
        url: "https://uhs.berkeley.edu/counseling/lets-talk",
        effort: "Fast",
        fit: ["work_high", "gpa_low"],
      },
      {
        name: "SHIP Mental Health Benefits",
        description: "Use student health insurance for therapy and psychiatry referrals.",
        action: "Check SHIP coverage",
        url: "https://uhs.berkeley.edu/insurance-ship",
        effort: "Medium",
        fit: ["current_aid"],
      },
    ],
  },
  {
    id: "safety",
    title: "Safety + Late-Night Support",
    accent: "#f87171",
    summary: "Safe routes, BearWalk, and urgent campus safety support.",
    items: [
      {
        name: "BearWalk",
        description: "Night safety escort service around campus.",
        action: "Request BearWalk before walking",
        url: "https://nightsafety.berkeley.edu/nightsafety/escort",
        effort: "Fast",
        fit: ["housing_situation:off-campus", "work_high"],
      },
      {
        name: "Night Safety Shuttle",
        description: "Campus night transit for safer late travel.",
        action: "Check shuttle routes",
        url: "https://nightsafety.berkeley.edu",
        effort: "Fast",
        fit: ["housing_situation:off-campus"],
      },
      {
        name: "UCPD Non-Emergency",
        description: "Campus safety guidance and non-emergency reporting.",
        action: "Save the non-emergency contact",
        url: "https://ucpd.berkeley.edu",
        effort: "Fast",
        fit: [],
      },
    ],
  },
  {
    id: "scholarship",
    title: "Scholarships + Grants",
    accent: "#fb923c",
    summary: "Micro-scholarships, department awards, and essay reuse.",
    items: [
      {
        name: "Berkeley Scholarship Connection",
        description: "Campus scholarship database for current students.",
        action: "Search awards by major and year",
        url: "https://scholarships.berkeley.edu",
        effort: "Medium",
        fit: ["major", "gpa_high"],
      },
      {
        name: "Department Awards",
        description: "Major-specific scholarships with smaller applicant pools.",
        action: "Ask your department about awards",
        url: "https://financialaid.berkeley.edu/types-of-aid-at-berkeley/scholarships/",
        effort: "Medium",
        fit: ["major", "gpa_high"],
      },
      {
        name: "Emergency Grants via Basic Needs",
        description: "Crisis grants or referrals when urgent costs threaten enrollment.",
        action: "Ask for emergency grant screening",
        url: "https://basicneeds.berkeley.edu",
        effort: "Medium",
        fit: ["efc_low", "housing_situation:unstably-housed"],
      },
    ],
  },
];

function scoreResource(item: ResourceItem, profile: ReturnType<typeof useAppState>["profile"]) {
  let score = 0;
  const facts = new Set<string>();
  facts.add(`meal_plan:${profile.meal_plan}`);
  facts.add(`housing_situation:${profile.housing_situation}`);
  facts.add(`citizenship:${profile.citizenship}`);
  if (profile.efc_sai <= 1500) facts.add("efc_low");
  if (profile.work_hours_per_week >= 15) facts.add("work_high");
  if (profile.current_aid.length > 0) facts.add("current_aid");
  if (profile.major.trim()) facts.add("major");
  if (profile.gpa_band === "below-2.0" || profile.gpa_band === "2.0-3.0") facts.add("gpa_low");
  if (profile.gpa_band === "3.5+") facts.add("gpa_high");

  for (const fit of item.fit) {
    if (facts.has(fit)) score += 2;
  }
  if (item.effort === "Fast") score += 1;
  return score;
}

function fitReason(item: ResourceItem, profile: ReturnType<typeof useAppState>["profile"]) {
  const reasons: string[] = [];
  if (item.fit.includes(`meal_plan:${profile.meal_plan}`)) reasons.push(`meal plan: ${profile.meal_plan}`);
  if (item.fit.includes(`housing_situation:${profile.housing_situation}`)) {
    reasons.push(`housing: ${profile.housing_situation}`);
  }
  if (profile.efc_sai <= 1500 && item.fit.includes("efc_low")) reasons.push("low SAI/EFC");
  if (profile.work_hours_per_week >= 15 && item.fit.includes("work_high")) {
    reasons.push(`${profile.work_hours_per_week} work hrs/week`);
  }
  if (profile.major.trim() && item.fit.includes("major")) reasons.push(profile.major);
  if (reasons.length === 0) return "Useful Berkeley baseline resource";
  return `Matched: ${reasons.slice(0, 2).join(", ")}`;
}

export default function ResourcesPage() {
  const { profile, profileInitialized } = useAppState();
  const complete = profileCompleteness(profile);

  return (
    <main className="min-h-[calc(100vh-4rem)] grid-bg noise">
      <section className="border-b border-white/5 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#fdb515]">
            Personalized Resource Stack
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Resources matched to your profile
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/45">
                Jugaad ranks Berkeley support by your meal plan, housing, aid, workload, and academic context.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ProfilePill label="Profile" value={`${complete}%`} active={profileInitialized} />
              <ProfilePill label="Campus" value={profile.campus} active />
              <ProfilePill label="SAI/EFC" value={`$${profile.efc_sai}`} active={profile.efc_sai <= 1500} />
            </div>
          </div>
          {!profileInitialized && (
            <div className="mt-5 flex flex-col gap-3 rounded-xl border border-[#fdb515]/20 bg-[#fdb515]/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-white/70">
                Add your profile to make this page sharper for aid, food, housing, and scholarships.
              </p>
              <Link
                href="/profile"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#fdb515] px-3 py-2 text-sm font-semibold text-[#050810]"
              >
                Complete profile
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-2">
        {SECTIONS.map((section) => {
          const ranked = [...section.items].sort(
            (a, b) => scoreResource(b, profile) - scoreResource(a, profile)
          );
          const topScore = scoreResource(ranked[0], profile);

          return (
            <section
              key={section.id}
              className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03]"
            >
              <div className="border-b border-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: section.accent }}>
                      {topScore >= 4 ? "High match" : topScore >= 2 ? "Recommended" : "Available"}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-white">{section.title}</h2>
                    <p className="mt-1 text-xs leading-relaxed text-white/45">{section.summary}</p>
                  </div>
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${section.accent}22`, border: `1px solid ${section.accent}55` }}
                  >
                    <Sparkles className="h-4 w-4" style={{ color: section.accent }} />
                  </span>
                </div>
              </div>

              <div className="divide-y divide-white/5">
                {ranked.map((item) => (
                  <article key={item.name} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-white">{item.name}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-white/50">{item.description}</p>
                      </div>
                      <span className="shrink-0 rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[10px] text-white/50">
                        {item.effort}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="inline-flex items-center gap-1 rounded-md border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-emerald-200/80">
                        <CheckCircle2 className="h-3 w-3" />
                        {fitReason(item, profile)}
                      </span>
                      {item.deadline && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-black/20 px-2 py-1 text-white/45">
                          <CalendarDays className="h-3 w-3" />
                          {item.deadline}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-medium text-white/75">{item.action}</p>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
                      >
                        Open
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </section>
    </main>
  );
}

function ProfilePill({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
        active
          ? "border-[#fdb515]/30 bg-[#fdb515]/10 text-[#fdb515]"
          : "border-white/10 bg-white/[0.03] text-white/45"
      }`}
    >
      <span className="text-white/35">{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}
