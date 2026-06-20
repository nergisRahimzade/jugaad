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
        <p className="text-xs font-mono text-muted uppercase tracking-wider mb-2">Live Demo</p>
        <h1 className="font-serif text-3xl sm:text-4xl text-white">
          Speak your problem. Watch agents collaborate.
        </h1>
        <p className="mt-2 text-muted max-w-2xl">
          Voice-first interface powered by Deepgram. Your query routes through the Fetch.ai Coordinator
          to specialist agents — visible in real time.
        </p>
        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 mt-4 text-sm text-berkeley-gold hover:underline"
        >
          Deep dive: Fetch.ai agent architecture <ArrowRight size={14} />
        </Link>
      </div>

      <VoiceInterface />
    </div>
  );
}
