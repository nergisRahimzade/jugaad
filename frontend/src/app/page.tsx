"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react";
import Berkeley3DGlobe from "@/components/Berkeley3DGlobe";
import { useAppState } from "@/context/AppStateContext";
import { useSpeechToText } from "@/lib/useSpeechToText";
import { useTextToSpeech } from "@/lib/useTextToSpeech";

export default function HomePage() {
  const router = useRouter();
  const { chatMessages } = useAppState();
  const [query, setQuery] = useState("");
  const {
    listening,
    transcribing,
    error: speechError,
    toggleListening,
    setError: setSpeechError,
  } = useSpeechToText();
  const {
    speaking,
    synthesizing,
    error: ttsError,
    speak,
    stop: stopSpeaking,
  } = useTextToSpeech();

  const latestAssistantText =
    [...chatMessages].reverse().find((message) => message.role === "assistant" && message.content.trim())
      ?.content.trim() ?? "";
  const voiceBusy = listening || transcribing;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = query.trim();
    if (!text) return;
    stopSpeaking();
    sessionStorage.setItem("jugaad_home_prompt", text);
    router.push("/chat");
  }

  const toggleVoice = async () => {
    if (transcribing) return;
    stopSpeaking();
    setSpeechError(null);

    if (listening) {
      const text = await toggleListening();
      if (text.trim()) setQuery(text);
      return;
    }

    await toggleListening();
  };

  const toggleSpokenResponse = () => {
    if (speaking || synthesizing) {
      stopSpeaking();
      return;
    }
    if (latestAssistantText) void speak(latestAssistantText);
  };

  return (
    <>
      {/* UC-style institutional header */}
      <header className="border-b border-white/[0.06]">
        <div className="h-1 bg-[#fdb515]" aria-hidden />
        <div
          className="border-b border-white/[0.04]"
          style={{ background: "linear-gradient(180deg, rgba(0,50,98,0.35) 0%, transparent 100%)" }}
        >
          <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8 text-center">
            <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.22em] text-[#fdb515]">
              University of California, Berkeley
            </p>
            <h1 className="mt-3 text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Jugaad
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-white/45 max-w-xl mx-auto leading-relaxed">
              Just-in-time University Guidance And Actionable Discovery
            </p>
          </div>
        </div>
      </header>

      {/* Search → opens chat page */}
      <section className="mx-auto max-w-2xl px-4 sm:px-6 pt-8 pb-4">
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          onSubmit={handleSubmit}
        >
          <div
            className="flex items-end gap-2 rounded-xl p-2 sm:p-2.5 transition-all focus-within:border-[#003262]/60"
            style={{
              background: "rgba(15,14,24,0.6)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <button
              type="button"
              onClick={toggleVoice}
              disabled={transcribing}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all disabled:opacity-25 ${
                listening
                  ? "border-red-400/50 bg-red-500/20 text-red-400"
                  : "border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
              }`}
              aria-label={listening ? "Stop recording" : transcribing ? "Transcribing" : "Start voice prompt"}
            >
              {listening ? (
                <MicOff className="h-4 w-4" />
              ) : transcribing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={toggleSpokenResponse}
              disabled={!latestAssistantText && !speaking && !synthesizing}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all disabled:opacity-25 ${
                speaking || synthesizing
                  ? "border-[#fdb515]/50 bg-[#fdb515]/15 text-[#fdb515]"
                  : "border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
              }`}
              aria-label={
                speaking
                  ? "Stop spoken response"
                  : synthesizing
                    ? "Generating spoken response"
                    : "Speak latest assistant response"
              }
            >
              {synthesizing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : speaking ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              rows={1}
              placeholder={
                listening
                  ? "Listening... tap the red mic when done"
                  : transcribing
                    ? "Transcribing..."
                    : "Describe what you need, or tap the mic..."
              }
              disabled={voiceBusy}
              className="flex-1 resize-none bg-transparent px-3 py-2.5 text-sm sm:text-base text-white placeholder-white/35 outline-none min-h-[44px] max-h-32 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!query.trim() || voiceBusy}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all disabled:opacity-25 hover:opacity-90"
              style={{ background: "#003262", color: "#fdb515" }}
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          {(speechError || ttsError) && (
            <p className="mt-2 text-center text-xs text-red-400/80">{speechError ?? ttsError}</p>
          )}
        </motion.form>
      </section>

      <p className="text-center text-xs uppercase tracking-widest text-white/30 py-2">
        or
      </p>

      {/* Agent carousel */}
      <section className="mx-auto max-w-[1600px] px-3 pb-16 sm:px-6">
        <p className="mb-4 text-center text-sm text-white/45">
          Use the specific agent you want
        </p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          <Berkeley3DGlobe />
        </motion.div>
      </section>

      <footer
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        className="py-8"
      >
        <div
          className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm"
          style={{ color: "#9299ae" }}
        >
          <span className="font-semibold text-white">Jugaad</span>
          <span>UC Berkeley AI Hackathon 2026 · Free for all students</span>
        </div>
      </footer>
    </>
  );
}
