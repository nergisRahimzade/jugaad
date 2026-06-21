"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Send } from "lucide-react";
import { api, StudentProfile } from "@/lib/api";
import { campusAgentToDomain, type CampusAgent } from "@/components/Berkeley3DGlobe";

interface Message {
  role: "assistant" | "user";
  content: string;
}

interface AgentChatProps {
  agent: CampusAgent;
}

function loadProfile(): StudentProfile | null {
  if (typeof window === "undefined") return null;
  const stored = sessionStorage.getItem("jugaad_profile");
  if (!stored) return null;
  try {
    return JSON.parse(stored) as StudentProfile;
  } catch {
    return null;
  }
}

export default function AgentChat({ agent }: AgentChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hi — I'm the ${agent.agentName}. I focus on ${agent.issue.toLowerCase()}. Tell me what's going on and I'll help you find the right Berkeley hack.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile] = useState<StudentProfile | null>(() => loadProfile());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const domain = campusAgentToDomain(agent.id);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  useEffect(() => {
    const prompt = sessionStorage.getItem("jugaad_home_prompt");
    if (prompt?.trim()) {
      sessionStorage.removeItem("jugaad_home_prompt");
      setInput(prompt);
    }
  }, []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading || !domain) return;

    setInput("");
    const history = [...messages, { role: "user" as const, content: text }];
    setMessages(history);
    setLoading(true);
    setError(null);

    let assistantText = "";
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const prior = messages.map(({ role, content }) => ({ role, content }));
      for await (const chunk of api.streamChat(text, prior, { profile, domain })) {
        assistantText += chunk;
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: assistantText };
          return next;
        });
      }
    } catch {
      setError("Couldn't reach the agent. Make sure the backend is running.");
      setMessages((prev) => prev.slice(0, -1));
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

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 min-h-0 pb-2">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-end gap-3 mb-4 ${
              msg.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            {msg.role === "assistant" && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0"
                style={{ background: `${agent.color}33`, border: `1px solid ${agent.color}66` }}
              >
                {agent.emoji}
              </div>
            )}
            {msg.role === "user" && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.25)", color: "#a78bfa", fontWeight: 600 }}
              >
                me
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
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
              {msg.content || (loading && i === messages.length - 1 ? "…" : "")}
            </div>
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-red-400/80 text-xs text-center mb-2">{error}</p>}

      <div className="mt-3 pt-3 border-t border-white/5">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={loading ? `${agent.agentName} is thinking…` : "Describe what you need…"}
            disabled={loading}
            className="flex-1 glass rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 outline-none border border-white/5 focus:border-white/15 transition-colors disabled:opacity-40"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
            style={{ background: agent.color, color: "#09080f" }}
            aria-label="Send"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
