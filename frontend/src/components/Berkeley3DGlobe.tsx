"use client";

/**
 * Berkeley3DGlobe — Agent flashcard carousel
 *
 * Circular rotating flashcards for each campus issue agent.
 * Click a sidebar item to bring that card to the front and highlight it.
 *
 * ─── AGENT ROUTING ───
 *   openAgent(slug) → wire to specialist agents
 *
 * ─── USAGE ───
 *   import Berkeley3DGlobe from "@/components/Berkeley3DGlobe";
 *   <Berkeley3DGlobe />
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, ExternalLink, ChevronRight } from "lucide-react";

export interface CampusAgent {
  id: string;
  agentName: string;
  slug: string;
  emoji: string;
  issue: string;
  buildingName: string;
  latitude: number;
  longitude: number;
  height: number;
  description: string;
  imageUrl: string;
  color: string;
}

export const campusAgents: CampusAgent[] = [
  {
    id: "food",
    agentName: "Food Agent",
    slug: "jugaad-food-agent",
    emoji: "🍎",
    issue: "Food insecurity & CalFresh access",
    buildingName: "Crossroads Dining Hall",
    latitude: 37.8672,
    longitude: -122.2603,
    height: 0.14,
    description:
      "Campus dining hub where meal plan gaps, pantry routes, and CalFresh stacking strategies converge for hungry students.",
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
    color: "#34d399",
  },
  {
    id: "housing",
    agentName: "Housing Agent",
    slug: "jugaad-housing-agent",
    emoji: "🏠",
    issue: "Housing insecurity & off-campus search",
    buildingName: "Unit 1 & Unit 2 Residence Halls",
    latitude: 37.8711,
    longitude: -122.2568,
    height: 0.16,
    description:
      "Undergraduate residence cluster — key anchor for housing contracts, sublease hacks, and emergency shelter pathways.",
    imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
    color: "#60a5fa",
  },
  {
    id: "financial-aid",
    agentName: "Financial Aid Agent",
    slug: "jugaad-financial-aid-agent",
    emoji: "💰",
    issue: "FAFSA, SAI/EFC & aid stacking",
    buildingName: "Sproul Hall — Financial Aid Office",
    latitude: 37.8696,
    longitude: -122.2593,
    height: 0.15,
    description:
      "Central financial aid intake on Sproul Plaza — grants, loans, work-study, and crisis aid navigation start here.",
    imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
    color: "#fdb515",
  },
  {
    id: "safety",
    agentName: "Safety Agent",
    slug: "jugaad-safety-agent",
    emoji: "🛡️",
    issue: "Campus safety & late-night routes",
    buildingName: "UCPD / Campus Safety",
    latitude: 37.8701,
    longitude: -122.2645,
    height: 0.13,
    description:
      "UC Police Department area — BearWalk, blue-light phones, and safe-route guidance for night commuters.",
    imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
    color: "#f87171",
  },
  {
    id: "academic",
    agentName: "Academic Agent",
    slug: "jugaad-academic-agent",
    emoji: "📚",
    issue: "Academic support & tutoring",
    buildingName: "Doe & Moffitt Libraries",
    latitude: 37.8724,
    longitude: -122.2599,
    height: 0.17,
    description:
      "Main library quad — study resources, DSP accommodations, and course-recovery support networks.",
    imageUrl: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&q=80",
    color: "#a78bfa",
  },
  {
    id: "wellness",
    agentName: "Wellness Agent",
    slug: "jugaad-wellness-agent",
    emoji: "🧠",
    issue: "Mental health & CAPS access",
    buildingName: "Tang Center",
    latitude: 37.8671,
    longitude: -122.2644,
    height: 0.14,
    description:
      "University Health Services — CAPS, Let's Talk drop-ins, SHIP, and peer wellness matching.",
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
    color: "#38bdf8",
  },
  {
    id: "scholarship",
    agentName: "Scholarship Agent",
    slug: "jugaad-scholarship-agent",
    emoji: "🎓",
    issue: "Scholarships & emergency grants",
    buildingName: "Sproul Hall — Scholarships Desk",
    latitude: 37.8698,
    longitude: -122.2588,
    height: 0.12,
    description:
      "Scholarship matching and micro-grant discovery — stack departmental awards with external fellowships.",
    imageUrl: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80",
    color: "#fb923c",
  },
];

export const AGENT_DOMAIN_BY_ID: Record<string, string> = {
  food: "food",
  housing: "housing",
  "financial-aid": "financial_aid",
  safety: "safety",
  academic: "academic",
  wellness: "wellness",
  scholarship: "scholarship",
};

export function campusAgentToDomain(agentId: string): string | undefined {
  return AGENT_DOMAIN_BY_ID[agentId];
}

const CARD_COUNT = campusAgents.length;
const ANGLE_STEP = 360 / CARD_COUNT;
const RING_RADIUS = 280;

function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

function shortestRotation(from: number, to: number): number {
  const diff = normalizeAngle(to - from);
  return diff > 180 ? diff - 360 : diff;
}

function AgentSidebar({
  agents,
  activeIndex,
  onSelect,
}: {
  agents: CampusAgent[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <aside className="flex h-full flex-col border-r border-white/10 bg-[#09080f]/90 backdrop-blur-xl">
      <div className="border-b border-white/10 px-4 py-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#fdb515]">UC Berkeley</p>
        <h2 className="mt-1 text-lg font-semibold text-white">Issue Agents</h2>
        <p className="mt-1 text-xs text-white/40">Click to bring a flashcard to the front</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {agents.map((agent, index) => {
          const active = activeIndex === index;
          return (
            <button
              key={agent.id}
              type="button"
              onClick={() => onSelect(index)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all ${
                active ? "bg-white/10" : "hover:bg-white/5"
              }`}
              style={
                active
                  ? { boxShadow: `inset 0 0 0 2px ${agent.color}, 0 0 20px ${agent.color}33` }
                  : undefined
              }
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg"
                style={{ background: `${agent.color}22`, border: `1px solid ${agent.color}55` }}
              >
                {agent.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{agent.agentName}</p>
                <p className="truncate text-[11px] text-white/40">{agent.buildingName}</p>
              </div>
              <ChevronRight className={`h-4 w-4 shrink-0 ${active ? "text-[#fdb515]" : "text-white/20"}`} />
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function AgentFlashcard({
  agent,
  active,
  onClick,
}: {
  agent: CampusAgent;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.div
      role="button"
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      animate={{
        scale: active ? 1 : 0.82,
        opacity: active ? 1 : 0.45,
      }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="group flex h-full max-h-[320px] w-[240px] cursor-pointer flex-col overflow-hidden rounded-2xl text-left shadow-2xl sm:w-[260px]"
      style={{
        background: "#0c0b14",
        border: active ? `2px solid ${agent.color}` : "1px solid rgba(255,255,255,0.08)",
        boxShadow: active
          ? `0 0 40px ${agent.color}55, 0 20px 50px rgba(0,0,0,0.5)`
          : "0 8px 30px rgba(0,0,0,0.4)",
        pointerEvents: active ? "auto" : "none",
      }}
    >
      <div className="relative h-20 shrink-0 overflow-hidden sm:h-24">
        <img
          src={agent.imageUrl}
          alt={agent.buildingName}
          className="h-full w-full object-cover opacity-85 transition group-hover:opacity-100"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200'%3E%3Crect fill='%2313111f' width='400' height='200'/%3E%3Ctext x='50%25' y='50%25' fill='%23fdb515' text-anchor='middle' dy='.3em' font-size='14'%3EBuilding photo%3C/text%3E%3C/svg%3E";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0b14] via-transparent to-transparent" />
        <span
          className="absolute left-3 top-3 rounded-lg px-2 py-1 text-lg"
          style={{ background: `${agent.color}33`, border: `1px solid ${agent.color}66` }}
        >
          {agent.emoji}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: agent.color }}>
          {agent.agentName}
        </p>
        <h3 className="mt-0.5 text-sm font-semibold leading-snug text-white">{agent.buildingName}</h3>

        <div className="mt-2 flex items-start gap-2 rounded-lg bg-white/5 p-2 ring-1 ring-white/10">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/40" />
          <div>
            <p className="text-[10px] text-white/40">Related issue</p>
            <p className="text-xs text-white/85">{agent.issue}</p>
          </div>
        </div>

        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/55">{agent.description}</p>

        {active && (
          <div className="mt-3">
            <Link
              href={`/agent/${agent.id}`}
              prefetch
              onClick={(e) => e.stopPropagation()}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition hover:brightness-110 active:scale-[0.98]"
              style={{ background: agent.color, color: "#09080f" }}
            >
              Open Agent
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CircularFlashcards({
  agents,
  activeIndex,
  ringRotation,
  onSelect,
}: {
  agents: CampusAgent[];
  activeIndex: number;
  ringRotation: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
      style={{ perspective: "1100px", perspectiveOrigin: "50% 45%" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(253,181,21,0.06) 0%, transparent 55%)",
        }}
      />

      <motion.div
        className="relative h-[340px] w-[340px] sm:h-[380px] sm:w-[380px]"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: ringRotation }}
        transition={{ type: "spring", stiffness: 70, damping: 22 }}
      >
        {agents.map((agent, index) => {
          const angle = index * ANGLE_STEP;
          const active = index === activeIndex;

          return (
            <div
              key={agent.id}
              className="absolute left-1/2 top-1/2"
              style={{
                width: 260,
                height: 320,
                marginLeft: -130,
                marginTop: -160,
                transformStyle: "preserve-3d",
                transform: `rotateY(${angle}deg) translateZ(${RING_RADIUS}px)`,
              }}
            >
              <AgentFlashcard
                agent={agent}
                active={active}
                onClick={() => onSelect(index)}
              />
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

export default function Berkeley3DGlobe() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [ringRotation, setRingRotation] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const rotationRef = useRef(0);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const snapToIndex = useCallback((index: number) => {
    const target = -index * ANGLE_STEP;
    const delta = shortestRotation(rotationRef.current, target);
    const next = rotationRef.current + delta;
    rotationRef.current = next;
    setRingRotation(next);
    setActiveIndex(index);
  }, []);

  const selectAgent = useCallback(
    (index: number) => {
      setAutoRotate(false);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      snapToIndex(index);
      pauseTimerRef.current = setTimeout(() => setAutoRotate(true), 8000);
    },
    [snapToIndex]
  );

  useEffect(() => {
    campusAgents.forEach((a) => router.prefetch(`/agent/${a.id}`));
  }, [router]);

  useEffect(() => {
    if (!autoRotate) return;

    const id = setInterval(() => {
      rotationRef.current -= 0.18;
      setRingRotation(rotationRef.current);

      const frontIndex =
        normalizeAngle(-rotationRef.current) / ANGLE_STEP;
      const rounded = Math.round(frontIndex) % CARD_COUNT;
      setActiveIndex((rounded + CARD_COUNT) % CARD_COUNT);
    }, 40);

    return () => clearInterval(id);
  }, [autoRotate]);

  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, []);

  return (
    <div className="relative flex h-[480px] sm:h-[540px] lg:h-[580px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#02040a] shadow-2xl shadow-black/40">
      <button
        type="button"
        onClick={() => setSidebarOpen((v) => !v)}
        className="absolute left-3 top-3 z-30 rounded-lg bg-black/60 px-3 py-2 text-xs font-medium text-white ring-1 ring-white/10 md:hidden"
      >
        {sidebarOpen ? "Hide agents" : "Show agents"}
      </button>

      <div
        className={`absolute md:relative z-10 h-full w-[min(100%,280px)] shrink-0 transition-transform md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <AgentSidebar
          agents={campusAgents}
          activeIndex={activeIndex}
          onSelect={selectAgent}
        />
      </div>

      <div className="relative min-w-0 flex-1">
        <CircularFlashcards
          agents={campusAgents}
          activeIndex={activeIndex}
          ringRotation={ringRotation}
          onSelect={selectAgent}
        />
      </div>
    </div>
  );
}
