import { VoiceInterface } from "@/components/VoiceInterface";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Live Demo — Jugaad",
  description: "Voice-first demo with Deepgram STT/TTS and live agent activity feed",
};

export default function DemoPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
      <div className="mb-8">
        <p className="text-xs text-white/30 uppercase tracking-wider mb-2">Live Demo</p>
        <h1 className="font-serif text-3xl sm:text-4xl text-white">
          Describe your situation. Watch it get matched in real time.
        </h1>
        <p className="mt-2 text-white/50 max-w-2xl">
          Voice-first interface powered by Deepgram. Your query routes to specialist agents and returns matched resources within seconds.
        </p>
        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 mt-4 text-sm text-berkeley-gold hover:underline"
        >
          Deep dive: how the agent system works <ArrowRight size={14} />
        </Link>
      </div>

      <VoiceInterface />
    </div>
  );
}
