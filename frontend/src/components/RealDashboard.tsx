"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertTriangle, Clock, ExternalLink, ChevronDown, ChevronUp, CheckSquare, AlertCircle } from "lucide-react";
import { api, StudentProfile, HackStack, HackItem } from "@/lib/api";
import ApplyNowModal from "./ApplyNowModal";

const DOMAIN_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  food:          { icon: "🍎", color: "#34D399", label: "Food & Groceries" },
  housing:       { icon: "🏠", color: "#60A5FA", label: "Housing" },
  financial_aid: { icon: "💰", color: "#A78BFA", label: "Money & Funding" },
  safety:        { icon: "🛡️", color: "#F87171", label: "Safety" },
  wellness:      { icon: "🧠", color: "#E879F9", label: "Mental Health" },
  academic:      { icon: "📚", color: "#38BDF8", label: "Academic" },
};

const DOMAINS = ["food", "housing", "financial_aid", "wellness", "safety", "academic"];

const DOMAIN_QUERIES: Record<string, string> = {
  food: "I need help with food and groceries",
  housing: "I need help with housing",
  financial_aid: "I need financial aid and scholarships",
  wellness: "I need mental health support",
  safety: "I need safety resources",
  academic: "I need academic help",
};

function UrgencyBadge({ deadline, daysUntil }: { deadline: string | null; daysUntil?: number }) {
  if (!deadline || deadline === "rolling") return null;

  const days = daysUntil;
  if (days === undefined || days === null) return null;

  if (days <= 2) return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
      style={{ background: "rgba(248,113,113,0.15)", color: "#F87171", border: "1px solid rgba(248,113,113,0.3)" }}>
      <AlertCircle className="w-3 h-3" /> {days <= 0 ? "TODAY" : `${days}d`}
    </span>
  );
  if (days <= 7) return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold"
      style={{ background: "rgba(253,181,21,0.12)", color: "#fdb515", border: "1px solid rgba(253,181,21,0.2)" }}>
      <Clock className="w-3 h-3" /> {days}d
    </span>
  );
  if (days <= 30) return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
      style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
      <Clock className="w-3 h-3" /> {days}d
    </span>
  );
  return null;
}

function HackCard({
  hack,
  profile,
  deadlineData,
}: {
  hack: HackItem;
  profile: StudentProfile;
  deadlineData?: { days_until: number | null; urgency: string };
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="glass rounded-xl p-4 border border-white/5 hover:border-white/10 transition flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-white/90 text-sm font-medium leading-snug">{hack.name}</p>
            {hack.dollar_value && (
              <p className="text-berkeley-gold text-xs mt-0.5 font-semibold">{hack.dollar_value}</p>
            )}
          </div>
          <UrgencyBadge deadline={hack.deadline} daysUntil={deadlineData?.days_until ?? undefined} />
        </div>

        <p className="text-white/50 text-xs leading-relaxed line-clamp-2">{hack.description}</p>

        <div className="flex items-center gap-1.5 text-xs text-white/30">
          <Clock className="w-3 h-3" />
          {hack.effort_level}
        </div>

        <div className="flex gap-2 mt-auto">
          {hack.url && (
            <a
              href={hack.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition"
            >
              <ExternalLink className="w-3 h-3" /> Open
            </a>
          )}
          <button
            onClick={() => setModalOpen(true)}
            className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg transition"
            style={{ background: "rgba(253,181,21,0.12)", color: "#fdb515", border: "1px solid rgba(253,181,21,0.2)" }}
          >
            Apply Now
          </button>
        </div>
      </div>

      {modalOpen && (
        <ApplyNowModal hack={hack} profile={profile} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}

function DomainSection({
  domain,
  profile,
  deadlineMap,
}: {
  domain: string;
  profile: StudentProfile;
  deadlineMap: Record<string, { days_until: number | null; urgency: string }>;
}) {
  const cfg = DOMAIN_CONFIG[domain];
  const [stack, setStack] = useState<HackStack | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(domain === "food" || domain === "financial_aid");
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!expanded || fetched) return;
    setFetched(true);
    setLoading(true);
    api.recommend(profile, DOMAIN_QUERIES[domain])
      .then(setStack)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [expanded, fetched, domain, profile]);

  return (
    <div className="glass rounded-2xl border border-white/5 overflow-hidden">
      {/* Section header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-white/3 transition text-left"
      >
        <span className="text-xl">{cfg.icon}</span>
        <span className="font-semibold text-white flex-1">{cfg.label}</span>
        {stack && (
          <span className="text-xs text-white/30 font-mono">{stack.hacks.length} resources</span>
        )}
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-white/30" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/30" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
              {loading && (
                <div className="flex items-center gap-2 text-white/30 text-sm py-4 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Finding your {cfg.label.toLowerCase()} hacks…
                </div>
              )}

              {stack && !loading && (
                <>
                  <p className="text-white/50 text-sm leading-relaxed">{stack.narrative}</p>
                  {stack.total_value && (
                    <p className="text-xs font-mono text-berkeley-gold/70">
                      Total value: {stack.total_value}
                    </p>
                  )}
                  <div className="grid sm:grid-cols-2 gap-3 mt-3">
                    {stack.hacks.map((hack) => (
                      <HackCard
                        key={hack.id}
                        hack={hack}
                        profile={profile}
                        deadlineData={deadlineMap[hack.id]}
                      />
                    ))}
                  </div>
                  {stack.stacking_tip && (
                    <div className="rounded-xl border border-white/5 bg-white/2 p-3 mt-2">
                      <p className="text-xs text-white/40 uppercase tracking-widest font-mono mb-1">Pro tip</p>
                      <p className="text-sm text-white/70">{stack.stacking_tip}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChecklistPanel({ profile }: { profile: StudentProfile }) {
  const [checklist, setChecklist] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [fetched, setFetched] = useState(false);

  function toggle() {
    setOpen(!open);
    if (!fetched) {
      setFetched(true);
      setLoading(true);
      api.checklist(profile)
        .then((r) => setChecklist(r.checklist))
        .catch(() => setChecklist("Couldn't load checklist — check backend connection."))
        .finally(() => setLoading(false));
    }
  }

  return (
    <div className="glass rounded-2xl border border-white/5 overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center gap-3 p-4 hover:bg-white/3 transition text-left"
      >
        <CheckSquare className="w-5 h-5 text-berkeley-gold" />
        <span className="font-semibold text-white flex-1">Your First 30 Days Action Plan</span>
        {open ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-white/5 pt-3">
              {loading && (
                <div className="flex items-center gap-2 text-white/30 text-sm py-4 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating your action plan…
                </div>
              )}
              {checklist && !loading && (
                <div className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap prose-sm">
                  {checklist}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CalFreshPanel({ profile }: { profile: StudentProfile }) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [eligible, setEligible] = useState<boolean | null>(null);

  async function start() {
    setOpen(true);
    if (started) return;
    setStarted(true);
    setLoading(true);
    try {
      const res = await api.calfreshCheck(profile, [], "Do I qualify for CalFresh?");
      setMessages([{ role: "assistant", content: res.message }]);
      if (res.eligibility_determined) setEligible(res.likely_eligible);
    } catch {
      setMessages([{ role: "assistant", content: "Couldn't connect to backend." }]);
    } finally {
      setLoading(false);
    }
  }

  async function send() {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res = await api.calfreshCheck(profile, messages, text);
      setMessages([...newMessages, { role: "assistant", content: res.message }]);
      if (res.eligibility_determined) setEligible(res.likely_eligible);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Error — try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass rounded-2xl border border-white/5 overflow-hidden">
      <button
        onClick={open ? () => setOpen(false) : start}
        className="w-full flex items-center gap-3 p-4 hover:bg-white/3 transition text-left"
      >
        <span className="text-xl">🍎</span>
        <div className="flex-1">
          <span className="font-semibold text-white">CalFresh — up to $292/month in groceries</span>
          {eligible !== null && (
            <span className={`ml-2 text-xs font-semibold ${eligible ? "text-green-400" : "text-white/40"}`}>
              {eligible ? "✓ Likely eligible" : "Not eligible"}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-2">
              {messages.map((m, i) => (
                <div key={i} className={`text-sm rounded-xl px-3 py-2 ${
                  m.role === "assistant"
                    ? "bg-white/4 text-white/80"
                    : "text-white/60 text-right"
                }`}>
                  {m.content}
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-white/30 text-xs py-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Thinking…
                </div>
              )}
              {eligible === null && !loading && messages.length > 0 && (
                <div className="flex gap-2 mt-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Type your answer…"
                    className="flex-1 glass rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 outline-none border border-white/5 focus:border-white/15 transition"
                  />
                  <button
                    onClick={send}
                    disabled={!input.trim() || loading}
                    className="px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-30 transition"
                    style={{ background: "#fdb515", color: "#050810" }}
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DeadlineAlerts({
  profile,
}: {
  profile: StudentProfile;
}) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/deadlines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile }),
    })
      .then((r) => r.json())
      .then((d) => setAlerts(d.alerts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [profile]);

  const urgent = alerts.filter((a) => ["48h", "7days"].includes(a.urgency));
  if (loading || urgent.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border p-4 space-y-2"
      style={{ borderColor: "rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.06)" }}
    >
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle className="w-4 h-4 text-red-400" />
        <p className="text-sm font-semibold text-red-400">
          {urgent.length} upcoming deadline{urgent.length > 1 ? "s" : ""} — don&apos;t miss these
        </p>
      </div>
      {urgent.map((a) => (
        <div key={a.hack_id} className="flex items-center justify-between text-xs">
          <span className="text-white/70">{a.hack_name}</span>
          <div className="flex items-center gap-2">
            {a.dollar_value && <span className="text-berkeley-gold">{a.dollar_value}</span>}
            <span className="text-red-400 font-semibold">
              {a.days_until <= 0 ? "TODAY" : a.days_until <= 2 ? `${a.days_until}d` : `${a.days_until} days`}
            </span>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

export default function RealDashboard({ profile }: { profile: StudentProfile }) {
  const [deadlineMap, setDeadlineMap] = useState<Record<string, { days_until: number | null; urgency: string }>>({});

  useEffect(() => {
    fetch("http://localhost:8000/deadlines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile }),
    })
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, { days_until: number | null; urgency: string }> = {};
        for (const a of d.alerts ?? []) {
          map[a.hack_id] = { days_until: a.days_until, urgency: a.urgency };
        }
        setDeadlineMap(map);
      })
      .catch(() => {});
  }, [profile]);

  return (
    <div className="space-y-4">
      {/* Profile banner */}
      <div className="rounded-2xl p-4 border flex items-center gap-4" style={{ background: "rgba(253,181,21,0.04)", border: "1px solid rgba(253,181,21,0.12)" }}>
        <div className="w-10 h-10 rounded-full bg-berkeley-gold/10 border border-berkeley-gold/30 flex items-center justify-center text-lg">
          👋
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">
            {profile.major} at {profile.campus}
          </p>
          <p className="text-white/40 text-xs">
            Your personalized resources are below — tap any section to expand
          </p>
        </div>
      </div>

      {/* Deadline alerts */}
      <DeadlineAlerts profile={profile} />

      {/* Domain hack stacks */}
      {DOMAINS.map((domain) => (
        <DomainSection
          key={domain}
          domain={domain}
          profile={profile}
          deadlineMap={deadlineMap}
        />
      ))}

      {/* Tools */}
      <CalFreshPanel profile={profile} />
      <ChecklistPanel profile={profile} />
    </div>
  );
}
