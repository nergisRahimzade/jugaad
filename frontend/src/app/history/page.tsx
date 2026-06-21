"use client";

import { useRouter } from "next/navigation";
import { Clock, MessageSquareText, RotateCcw } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";

function formatDate(value: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function HistoryPage() {
  const router = useRouter();
  const { chatHistory, restoreChatSession, startNewChat } = useAppState();

  const openSession = (sessionId: string) => {
    restoreChatSession(sessionId);
    sessionStorage.setItem("jugaad_restored_chat", "true");
    router.push("/chat");
  };

  const newChat = () => {
    startNewChat();
    router.push("/chat");
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] grid-bg noise px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 border-b border-white/5 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#fdb515]">
              Conversation Archive
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Chat history</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/45">
              Past conversations live here so the Chat tab can stay fresh for each new question.
            </p>
          </div>
          <button
            type="button"
            onClick={newChat}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#fdb515] px-4 py-2.5 text-sm font-semibold text-[#050810]"
          >
            <MessageSquareText className="h-4 w-4" />
            New chat
          </button>
        </div>

        <section className="mt-6 space-y-3">
          {chatHistory.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-14 text-center">
              <MessageSquareText className="mx-auto h-8 w-8 text-white/25" />
              <h2 className="mt-3 text-sm font-semibold text-white">No archived conversations yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-white/40">
                Ask something in Chat, then come back here after starting another chat.
              </p>
            </div>
          ) : (
            chatHistory.map((session) => {
              const lastAssistant = [...session.messages]
                .reverse()
                .find((message) => message.role === "assistant" && message.content.trim());

              return (
                <article
                  key={session.id}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 transition hover:border-white/15 hover:bg-white/[0.05]"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[11px] text-white/35">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(session.updatedAt)}
                        <span>•</span>
                        <span>{session.messages.length} messages</span>
                      </div>
                      <h2 className="mt-2 line-clamp-1 text-base font-semibold text-white">
                        {session.title}
                      </h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/45">
                        {lastAssistant?.content || "No assistant response saved."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openSession(session.id)}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/70 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reopen
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
