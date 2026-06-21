"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import CoordinatorChat from "@/components/CoordinatorChat";
import { useAppState } from "@/context/AppStateContext";

export default function ChatPage() {
  const [initialMessage, setInitialMessage] = useState<string | null>(null);
  const { startNewChat } = useAppState();
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    const restored = sessionStorage.getItem("jugaad_restored_chat") === "true";
    if (restored) {
      sessionStorage.removeItem("jugaad_restored_chat");
      return;
    }

    const prompt = sessionStorage.getItem("jugaad_home_prompt");
    const selectedAgent = sessionStorage.getItem("jugaad_selected_agent_domain");
    startNewChat();

    if (prompt) {
      sessionStorage.removeItem("jugaad_home_prompt");
      setInitialMessage(prompt);
    }
    if (selectedAgent) {
      setInitialMessage(null);
    }
  }, [startNewChat]);

  return (
    <main className="min-h-[calc(100vh-4rem)] grid-bg noise flex flex-col">
      <div className="border-b border-white/5 px-6 py-4 shrink-0">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-white font-semibold leading-tight">Chat</h1>
          <p className="text-white/40 text-xs mt-1">
            Ask Jugaad for support. Specialist routing appears in the answer badges.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden px-4 py-6 min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 max-w-2xl mx-auto w-full flex flex-col overflow-hidden min-h-0"
        >
          <section className="min-h-0 overflow-hidden rounded-2xl border border-white/5 bg-black/10 p-3 sm:p-4">
            <CoordinatorChat fullPage initialMessage={initialMessage} />
          </section>
        </motion.div>
      </div>
    </main>
  );
}
