import Link from "next/link";
import { ArrowRight, Search, Layers, Bot } from "lucide-react";
import { Hero3D } from "@/components/Hero3D";

const STATS = [
  { value: "17,000", label: "food-insecure students" },
  { value: "3,300+", label: "housing insecure" },
  { value: "8", label: "Fetch.ai uAgents live" },
  { value: "61%", label: "report stress obstacle" },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-berkeley-gold/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 pb-20 lg:pt-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-mono text-muted mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                UC Berkeley AI Hackathon 2026 · Ddoski&apos;s World
              </div>

              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl text-white leading-[1.05] tracking-tight">
                Student resources,{" "}
                <span className="gradient-text">matched by AI</span>
              </h1>

              <p className="mt-6 text-lg text-muted max-w-lg leading-relaxed">
                Voice-powered platform that finds food, housing, financial aid, wellness, and safety
                resources for Berkeley students — powered by{" "}
                <strong className="text-white">8 Fetch.ai uAgents</strong>, Deepgram voice, and a
                live knowledge graph.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/intake"
                  className="inline-flex items-center gap-2 rounded-full bg-berkeley-gold px-6 py-3 text-sm font-semibold text-berkeley-blue hover:bg-[#ffc940] hover:shadow-lg hover:shadow-berkeley-gold/25 transition"
                >
                  Get My Hack Stack <ArrowRight size={16} />
                </Link>
                <Link
                  href="/agents"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white hover:bg-white/5 transition"
                >
                  Fetch.ai Agent Demo
                </Link>
              </div>

              <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {STATS.map(({ value, label }) => (
                  <div key={label}>
                    <div className="font-serif text-2xl sm:text-3xl text-berkeley-gold">{value}</div>
                    <div className="text-xs text-muted mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <Hero3D className="animate-float" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/5 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="font-serif text-3xl sm:text-4xl text-white mb-12">
            How it works
          </h2>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: Search,
                title: "Describe your situation",
                desc: "Speak or type your problem. Deepgram transcribes, the Coordinator routes to the right agents.",
              },
              {
                icon: Layers,
                title: "Get matched resources",
                desc: "Agents search Redis + live Berkeley sites and return stacked resources — CalFresh, pantry, aid, and more.",
              },
              {
                icon: Bot,
                title: "Multi-agent coordination",
                desc: "8 Fetch.ai uAgents collaborate via mailbox protocol and Band cross-triggers.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="glass rounded-2xl p-6 hover:border-white/15 transition">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-berkeley-gold/10 text-berkeley-gold mb-4">
                  <Icon size={20} />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA to Fetch AI */}
      <section className="py-20 bg-gradient-to-b from-berkeley-blue/20 to-transparent border-t border-white/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <p className="text-xs font-mono text-berkeley-gold uppercase tracking-[0.2em] mb-4">
            Fetch.ai integration
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-white max-w-2xl mx-auto">
            Real uAgents. Real mailbox protocol. Not a chatbot wrapper.
          </h2>
          <p className="mt-4 text-muted max-w-xl mx-auto">
            Coordinator + 7 specialists on Agentverse testnet. Bureau runner, Band shared rooms,
            cross-domain triggers.
          </p>
          <Link
            href="/agents"
            className="inline-flex items-center gap-2 mt-8 rounded-full bg-white/10 border border-white/20 px-8 py-3.5 text-sm font-semibold text-white hover:bg-white/15 transition"
          >
            View Fetch.ai Agent Demo <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted">
          <span className="font-serif text-white">Jugaad</span>
          <span>UC Berkeley AI Hackathon 2026</span>
        </div>
      </footer>
    </>
  );
}
