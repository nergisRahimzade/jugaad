"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react";
import { api } from "@/lib/api";
import { getAgent } from "@/lib/agents";
import { useAppState } from "@/context/AppStateContext";
import { useSpeechToText } from "@/lib/useSpeechToText";
import { useTextToSpeech } from "@/lib/useTextToSpeech";
import type { AgentDomain, AgentEvent } from "@/lib/types";

const EVENT_STAGGER_MS = 160;

function toAgentEvent(raw: Omit<AgentEvent, "id" | "timestamp">): AgentEvent {
  return {
    ...raw,
    agentId: raw.agentId as AgentDomain,
    id: Math.random().toString(36).slice(2, 10),
    timestamp: Date.now(),
  };
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function stripAgentsHeader(text: string): string {
  return text
    .replace(/^\*\*Agents:\*\*[^\n]+\n+/i, "")
    .replace(/^\*\*Agents:\*\*[^\n]+/i, "")
    .replace(/\*\*/g, "")
    .trim();
}

function TypingIndicator() {
  return (
    <div className="flex gap-1 items-center h-5 px-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-white/50"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

function AgentBadges({ domains }: { domains: string[] }) {
  return (
    <div className="mt-1">
      <p className="text-[10px] font-mono uppercase tracking-wider text-white/35 mb-1.5">
        Agents used
      </p>
      <div className="flex flex-wrap gap-1.5">
        {domains.length === 0 ? (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{
              background: "rgba(253,181,21,0.12)",
              border: "1px solid rgba(253,181,21,0.35)",
              color: "#fdb515",
            }}
          >
            🎯 Jugaad
          </span>
        ) : (
          domains.map((domain) => {
            const agent = getAgent(domain);
            if (!agent) return null;
            return (
              <span
                key={domain}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{
                  background: `${agent.color}18`,
                  border: `1px solid ${agent.color}44`,
                  color: agent.color,
                }}
              >
                <span>{agent.icon}</span>
                {agent.displayName}
              </span>
            );
          })
        )}
      </div>
    </div>
  );
}

interface CoordinatorChatProps {
  fullPage?: boolean;
  initialMessage?: string | null;
}

export default function CoordinatorChat({ fullPage = false, initialMessage = null }: CoordinatorChatProps) {
  const {
    chatMessages: messages,
    setChatMessages: setMessages,
    setOrchestration,
    profile,
    profileInitialized,
    patchProfile,
    user,
  } = useAppState();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initialSent = useRef(false);
  const eventRevealChain = useRef(Promise.resolve());

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

  const voiceBusy = listening || transcribing;
  const latestAssistantText = stripAgentsHeader(
    [...messages].reverse().find((msg) => msg.role === "assistant" && msg.content.trim())
      ?.content ?? ""
  );
  const canSpeakLatest = Boolean(latestAssistantText) && !loading && !voiceBusy;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (textOverride?: string, options?: { fromVoice?: boolean }) => {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;

    stopSpeaking();
    setInput("");
    const prior = messages.map(({ role, content }) => ({ role, content }));
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    setError(null);
    eventRevealChain.current = Promise.resolve();

    setOrchestration({
      query: text,
      events: [],
      mergedResponse: null,
      activeAgents: ["coordinator"],
      requestId: null,
      running: true,
    });

    let assistantText = "";
    let routedAgents: string[] = [];
    setMessages((prev) => [...prev, { role: "assistant", content: "", agents: [] }]);

    const queueOrchestrationEvent = (raw: Omit<AgentEvent, "id" | "timestamp">) => {
      eventRevealChain.current = eventRevealChain.current.then(async () => {
        await delay(EVENT_STAGGER_MS);
        const full = toAgentEvent(raw);
        setOrchestration((o) => ({ ...o, events: [...o.events, full] }));
      });
    };

    try {
      for await (const event of api.streamCoordinator(text, prior, {
        profile,
        profileInitialized,
      })) {
        if (event.type === "meta") {
          routedAgents = event.agents;
          if (event.missingProfileFields) setMissingFields(event.missingProfileFields);
          if (event.profilePatch) patchProfile(event.profilePatch);
          setOrchestration((o) => ({
            ...o,
            activeAgents: ["coordinator", ...(event.agents as AgentDomain[])],
            requestId: event.requestId ?? null,
          }));
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = {
              role: "assistant",
              content: assistantText,
              agents: routedAgents,
            };
            return next;
          });
        } else if (event.type === "agent_event") {
          queueOrchestrationEvent(event.event);
        } else if (event.type === "chunk") {
          assistantText += event.text;
          setOrchestration((o) => ({ ...o, mergedResponse: assistantText }));
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = {
              role: "assistant",
              content: assistantText,
              agents: routedAgents,
            };
            return next;
          });
        }
      }

      await eventRevealChain.current;

      const finalText = stripAgentsHeader(assistantText);
      if (options?.fromVoice && finalText) {
        void speak(finalText);
      }
    } catch {
      setError("Couldn't reach Jugaad. Make sure the backend is running on port 8001.");
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
    } finally {
      setOrchestration((o) => ({ ...o, running: false }));
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage();
  }

  const toggleVoice = async () => {
    if (loading || transcribing) return;
    setSpeechError(null);

    if (listening) {
      const text = await toggleListening();
      if (text.trim()) {
        setInput(text);
        void sendMessage(text, { fromVoice: true });
      }
      return;
    }

    await toggleListening();
  };

  const toggleSpokenResponse = () => {
    if (speaking || synthesizing) {
      stopSpeaking();
      return;
    }

    if (canSpeakLatest) {
      void speak(latestAssistantText);
    }
  };

  useEffect(() => {
    if (initialSent.current || !initialMessage?.trim()) return;
    initialSent.current = true;
    void sendMessage(initialMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  return (
    <div className={`w-full flex flex-col ${fullPage ? "h-full min-h-0" : ""}`}>
      {messages.length > 0 && (
        <div
          className={`mb-4 space-y-4 pr-1 ${
            fullPage ? "flex-1 overflow-y-auto min-h-0" : "max-h-[420px] overflow-y-auto"
          }`}
        >
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {msg.role === "assistant" && (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 font-bold"
                  style={{ background: "#003262", color: "#fdb515" }}
                >
                  J
                </div>
              )}
              {msg.role === "user" && (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                  style={{
                    background: "rgba(167,139,250,0.15)",
                    border: "1px solid rgba(167,139,250,0.25)",
                    color: "#a78bfa",
                    fontWeight: 600,
                  }}
                >
                  me
                </div>
              )}
              <div className={`max-w-[85%] ${msg.role === "user" ? "text-right" : ""}`}>
                {msg.role === "assistant" && msg.agents !== undefined && (
                  <AgentBadges domains={msg.agents} />
                )}
                <div
                  className={`mt-2 rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "assistant"
                      ? "glass rounded-bl-sm text-white/90"
                      : "rounded-br-sm text-white/90"
                  }`}
                  style={
                    msg.role === "user"
                      ? {
                          background: "rgba(253, 181, 21, 0.12)",
                          border: "1px solid rgba(253, 181, 21, 0.2)",
                        }
                      : {}
                  }
                >
                  {msg.role === "assistant" ? (
                    loading && i === messages.length - 1 && !msg.content ? (
                      <TypingIndicator />
                    ) : (
                      stripAgentsHeader(msg.content) || "…"
                    )
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {(error || speechError || ttsError) && (
        <p className="text-red-400/80 text-xs text-center mb-3">{error ?? speechError ?? ttsError}</p>
      )}

      {!user && messages.length === 0 && (
        <p className="text-center text-xs text-white/35 mb-3">
          <Link href="/profile" className="text-[#fdb515] hover:underline">
            Set up your profile
          </Link>{" "}
          for personalized answers
        </p>
      )}

      {missingFields.length > 0 && messages.length > 0 && (
        <p className="text-center text-[11px] text-white/30 mb-3 px-2">
          Jugaad may ask about{" "}
          {missingFields.slice(0, 2).join(", ").replace(/_/g, " ")} — answer in chat or{" "}
          <Link href="/profile" className="text-[#fdb515] hover:underline">
            update profile
          </Link>
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className={fullPage ? "shrink-0 mt-auto pt-3 border-t border-white/5" : ""}
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
            disabled={loading || voiceBusy && !listening}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all disabled:opacity-25 ${
              listening
                ? "bg-red-500/20 border border-red-400/50 text-red-400"
                : "border border-white/10 text-white/70 hover:text-white hover:bg-white/5"
            }`}
            aria-label={listening ? "Stop recording and send" : transcribing ? "Transcribing" : "Start voice message"}
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
            disabled={!canSpeakLatest && !speaking && !synthesizing}
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
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            rows={1}
            placeholder={
              listening
                ? "Listening… tap the red mic when done"
                : transcribing
                  ? "Transcribing…"
                  : loading
                    ? "Jugaad is thinking…"
                    : "Describe what you need, or tap the mic…"
            }
            disabled={loading || voiceBusy}
            className="flex-1 resize-none bg-transparent px-3 py-2.5 text-sm sm:text-base text-white placeholder-white/35 outline-none min-h-[44px] max-h-32 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || voiceBusy}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all disabled:opacity-25 hover:opacity-90"
            style={{ background: "#003262", color: "#fdb515" }}
            aria-label="Send"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}
