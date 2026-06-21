"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowRight, Loader2 } from "lucide-react";
import { api, StudentProfile, IntakeStartResponse } from "@/lib/api";

interface Message {
  role: "assistant" | "user";
  content: string;
}

interface IntakeChatProps {
  onComplete: (profile: StudentProfile) => void;
}

const DOMAIN_COLORS: Record<string, string> = {
  food: "#34D399",
  housing: "#60A5FA",
  financial_aid: "#A78BFA",
  safety: "#F87171",
  wellness: "#E879F9",
  academic: "#38BDF8",
};

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 mb-4">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #fdb515, #ffcc55)", color: "#09080f", fontWeight: 700, fontSize: "14px" }}
      >
        J
      </div>
      <div className="glass rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-white/50"
              animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileSummary({ profile }: { profile: StudentProfile }) {
  const fields = [
    { label: "Campus", value: profile.campus },
    { label: "Status", value: profile.enrollment_status },
    { label: "Housing", value: profile.housing_situation },
    { label: "Meal plan", value: profile.meal_plan },
    { label: "SAI/EFC", value: `$${profile.efc_sai}` },
    { label: "Aid", value: profile.current_aid.join(", ") || "None listed" },
    { label: "Major", value: profile.major },
    { label: "Citizenship", value: profile.citizenship },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-5 mt-4 border border-white/10"
    >
      <p className="text-xs text-white/40 uppercase tracking-widest mb-3 font-mono">
        Here's what I found
      </p>
      <div className="grid grid-cols-2 gap-2">
        {fields.map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs text-white/40">{label}</p>
            <p className="text-sm text-white/90 capitalize">{value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function IntakeChat({ onComplete }: IntakeChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [questionsAsked, setQuestionsAsked] = useState(0);
  const [totalQuestions] = useState(7);
  const [completedProfile, setCompletedProfile] = useState<StudentProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Start the session on mount
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res: IntakeStartResponse = await api.intakeStart();
        setSessionId(res.session_id);
        setQuestionsAsked(res.questions_asked);
        setMessages([{ role: "assistant", content: res.message }]);
      } catch {
        setError("Couldn't connect to the backend. Make sure it's running on port 8000.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input after each assistant message
  useEffect(() => {
    if (!loading && !completedProfile) {
      inputRef.current?.focus();
    }
  }, [loading, completedProfile]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !sessionId || loading || completedProfile) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    setError(null);

    try {
      const res = await api.intakeContinue(sessionId, text);
      setQuestionsAsked(res.questions_asked ?? questionsAsked + 1);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.message },
      ]);

      if (res.is_complete && res.profile) {
        setCompletedProfile(res.profile);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setMessages((prev) => prev.slice(0, -1)); // remove the user message on error
      setInput(text);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const progress = Math.min((questionsAsked / totalQuestions) * 100, 100);

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-4 px-1">
        <div className="flex justify-between text-xs text-white/30 mb-1.5 font-mono">
          <span>Just a few questions</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "#fdb515" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 min-h-0 pb-2">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex items-end gap-3 mb-4 ${
                msg.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {/* Avatar */}
              {msg.role === "assistant" && (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #fdb515, #ffcc55)", color: "#09080f", fontWeight: 700, fontSize: "14px" }}
                >
                  J
                </div>
              )}
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0" style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.25)", color: "#a78bfa", fontWeight: 600 }}>
                  me
                </div>
              )}

              {/* Bubble */}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "assistant"
                    ? "glass rounded-bl-sm text-white/90"
                    : "rounded-br-sm text-white/90"
                }`}
                style={
                  msg.role === "user"
                    ? { background: "rgba(253, 181, 21, 0.12)", border: "1px solid rgba(253, 181, 21, 0.2)" }
                    : {}
                }
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {loading && <TypingIndicator />}

        {/* Completed profile summary */}
        {completedProfile && <ProfileSummary profile={completedProfile} />}

        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-400/80 text-xs text-center mb-2">{error}</p>
      )}

      {/* Input or CTA */}
      <div className="mt-3 pt-3 border-t border-white/5">
        {completedProfile ? (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onComplete(completedProfile)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all"
            style={{ background: "#fdb515", color: "#050810" }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            Show me my resources
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        ) : (
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={loading ? "Thinking…" : "Your answer…"}
              disabled={loading || !!completedProfile}
              className="flex-1 glass rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none border border-white/5 focus:border-white/15 transition-colors disabled:opacity-40"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading || !!completedProfile}
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background: "#fdb515" }}
              aria-label="Send"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#050810]" />
              ) : (
                <Send className="w-4 h-4 text-[#050810]" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
