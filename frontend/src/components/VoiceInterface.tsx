"use client";

import { useCallback, useState } from "react";
import { Mic, MicOff, Send, Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import { DEMO_QUERIES, simulateDemo } from "@/lib/demo-simulator";
import { useSpeechToText } from "@/lib/useSpeechToText";
import { useTextToSpeech } from "@/lib/useTextToSpeech";
import { AgentActivityFeed } from "./AgentActivityFeed";
import { AgentNetwork } from "./AgentNetwork";
import type { AgentDomain, AgentEvent, DemoResult } from "@/lib/types";

export function VoiceInterface() {
  const [query, setQuery] = useState("");
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [result, setResult] = useState<DemoResult | null>(null);

  const {
    listening,
    transcribing,
    transcript,
    error: speechError,
    toggleListening,
  } = useSpeechToText();

  const { speaking, synthesizing, speak, stop: stopSpeaking } = useTextToSpeech();

  const activeAgents: AgentDomain[] = result
    ? ["coordinator", ...result.routedDomains]
    : running
      ? ["coordinator"]
      : [];

  const submit = useCallback(async (text: string, spoken = false) => {
    if (!text.trim() || running) return;
    stopSpeaking();
    setQuery(text);
    setRunning(true);
    setEvents([]);
    setResult(null);

    const res = await simulateDemo(text, (event) => {
      setEvents((prev) => [...prev, event]);
    });

    setResult(res);
    setRunning(false);

    // Speak the response back when the user asked by voice.
    if (spoken && res.mergedPlan.trim()) {
      void speak(res.mergedPlan);
    }
  }, [running, speak, stopSpeaking]);

  const toggleMic = async () => {
    if (running || transcribing) return;

    if (speaking) {
      stopSpeaking();
      return;
    }

    if (listening) {
      const text = await toggleListening();
      if (text.trim()) {
        await submit(text, true);
      }
      return;
    }

    await toggleListening();
  };

  const busy = running || transcribing;

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Voice panel */}
      <div className="lg:col-span-2 space-y-4">
        <div className="glass rounded-2xl p-6 flex flex-col items-center text-center">
          <p className="text-xs font-mono text-muted uppercase tracking-wider mb-6">
            Voice-First Interface · Deepgram STT/TTS
          </p>

          <motion.button
            type="button"
            onClick={toggleMic}
            disabled={busy}
            whileTap={{ scale: 0.95 }}
            className={`relative flex h-28 w-28 items-center justify-center rounded-full border-2 transition-all ${
              listening
                ? "border-red-400 bg-red-500/20 shadow-lg shadow-red-500/30"
                : speaking
                  ? "border-emerald-400 bg-emerald-500/20 shadow-lg shadow-emerald-500/30"
                  : busy
                    ? "border-berkeley-gold/50 bg-berkeley-gold/10"
                    : "border-berkeley-gold bg-berkeley-gold/10 hover:bg-berkeley-gold/20 hover:shadow-lg hover:shadow-berkeley-gold/20"
            }`}
            aria-label={
              speaking ? "Stop playback" : listening ? "Stop recording" : "Start recording"
            }
          >
            {(listening || speaking) && (
              <span
                className={`absolute inset-0 rounded-full border-2 animate-pulse-ring ${
                  speaking ? "border-emerald-400" : "border-red-400"
                }`}
              />
            )}
            {speaking ? (
              <Volume2 size={36} className="text-emerald-400" />
            ) : listening ? (
              <MicOff size={36} className="text-red-400" />
            ) : (
              <Mic size={36} className="text-berkeley-gold" />
            )}
          </motion.button>

          <p className="mt-4 text-sm text-muted">
            {listening
              ? "Listening… tap again when done"
              : transcribing
                ? "Transcribing with Deepgram…"
                : running
                  ? "Agents processing your request…"
                  : synthesizing
                    ? "Generating voice with Deepgram…"
                    : speaking
                      ? "Speaking… tap to stop"
                      : "Press to speak your problem"}
          </p>

          {speechError && (
            <p className="mt-3 text-xs text-red-400/90">{speechError}</p>
          )}

          {transcript && (
            <div className="mt-4 w-full rounded-xl bg-black/30 border border-white/10 p-4 text-left">
              <p className="text-[10px] font-mono text-muted uppercase mb-1">Transcript</p>
              <p className="text-sm text-white/90 italic">&ldquo;{transcript}&rdquo;</p>
            </div>
          )}
        </div>

        {/* Text fallback */}
        <div className="glass rounded-2xl p-4 space-y-3">
          <p className="text-xs text-muted">Or type your problem:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit(query)}
              placeholder="I can't afford food this week…"
              className="flex-1 rounded-xl bg-black/30 border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-berkeley-gold/50"
            />
            <button
              type="button"
              onClick={() => submit(query)}
              disabled={busy || !query.trim()}
              className="rounded-xl bg-white/10 px-4 py-2.5 text-white hover:bg-white/15 disabled:opacity-50 transition"
            >
              <Send size={18} />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {DEMO_QUERIES.slice(0, 3).map(({ label, query: q }) => (
              <button
                key={label}
                type="button"
                onClick={() => submit(q)}
                disabled={busy}
                className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-muted hover:text-white transition disabled:opacity-50"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Agent visualization + feed */}
      <div className="lg:col-span-3 space-y-4">
        <div className="glass rounded-2xl p-4">
          <AgentNetwork activeAgents={activeAgents} highlightCoordinator={running} />
        </div>
        <AgentActivityFeed events={events} maxHeight="220px" />

        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl p-5 border border-emerald-500/20"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-semibold text-white">Agent Response</span>
            </div>
            <p className="text-sm text-white/85 leading-relaxed whitespace-pre-wrap">
              {result.mergedPlan.split("\n").slice(0, 8).join("\n")}
              {result.mergedPlan.split("\n").length > 8 && "\n…"}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
