"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import CoordinatorChat from "@/components/CoordinatorChat";

export default function ChatPage() {
  const [initialMessage] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const prompt = sessionStorage.getItem("jugaad_home_prompt");
    if (prompt) sessionStorage.removeItem("jugaad_home_prompt");
    return prompt;
  });

  return (
    <main className="min-h-[calc(100vh-4rem)] grid-bg noise flex flex-col">
      <div className="border-b border-white/5 px-6 py-4 shrink-0">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-white font-semibold leading-tight">Chat</h1>
            <p className="text-white/40 text-xs mt-1">
              Ask here — open How It Works to watch agents collaborate in real time
            </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden px-4 py-6 min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 max-w-2xl mx-auto w-full flex flex-col overflow-hidden min-h-0"
        >
          <CoordinatorChat fullPage initialMessage={initialMessage} />
        </motion.div>
      </div>
    </main>
  );
}
