"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AgentChat from "@/components/AgentChat";
import { campusAgents } from "@/components/Berkeley3DGlobe";

export default function AgentPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const agent = campusAgents.find((a) => a.id === id);

  if (!agent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-white/60 mb-4">Agent not found.</p>
          <Link href="/" className="text-[#fdb515] hover:underline text-sm">
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen grid-bg noise flex flex-col">
      <div className="border-b border-white/5 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
              style={{ background: `${agent.color}22`, border: `1px solid ${agent.color}55` }}
            >
              {agent.emoji}
            </span>
            <div>
              <h1 className="text-white font-semibold leading-tight">{agent.agentName}</h1>
              <p className="text-white/40 text-xs">{agent.issue}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden px-4 py-6 min-h-0">
        <div className="flex-1 max-w-2xl mx-auto w-full flex flex-col overflow-hidden min-h-0">
          <AgentChat agent={agent} />
        </div>
      </div>
    </main>
  );
}
