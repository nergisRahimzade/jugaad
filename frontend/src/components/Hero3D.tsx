"use client";

import dynamic from "next/dynamic";

const ModelCanvas = dynamic(() => import("./ModelCanvas").then((m) => m.ModelCanvas), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-surface/50">
      <div className="text-center space-y-3">
        <div className="mx-auto h-12 w-12 rounded-full border-2 border-berkeley-gold/30 border-t-berkeley-gold animate-spin" />
        <p className="text-sm text-muted font-mono">Loading…</p>
      </div>
    </div>
  ),
});

const LIVE_STATS = [
  { label: "Agents", value: "8 live",   color: "text-berkeley-gold" },
  { label: "Network", value: "testnet", color: "text-emerald-400" },
  { label: "Protocol", value: "uAgents", color: "text-blue-400" },
  { label: "Domains", value: "6 active", color: "text-purple-400" },
];

interface Hero3DProps {
  className?: string;
}

export function Hero3D({ className = "" }: Hero3DProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Ambient glow */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-berkeley-gold/8 via-transparent to-blue-500/8 blur-3xl pointer-events-none" />

      {/* 3D viewport */}
      <div
        className="relative h-[320px] sm:h-[420px] lg:h-[500px] w-full rounded-2xl overflow-hidden"
        style={{
          border: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(3, 8, 20, 0.6)",
          boxShadow: "0 0 80px rgba(253,181,21,0.1), 0 0 160px rgba(253,181,21,0.04), inset 0 0 60px rgba(0,0,0,0.4)",
        }}
      >
        <ModelCanvas />

        {/* Top-right live stats panel */}
        <div
          className="absolute top-4 right-4 rounded-xl px-4 py-3 space-y-2.5 min-w-[148px]"
          style={{
            background: "rgba(5, 8, 16, 0.75)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest pb-0.5 border-b border-white/5">
            Live
          </p>
          {LIVE_STATS.map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between gap-4 text-xs">
              <span className="text-white/40">{label}</span>
              <span className={`font-mono font-medium ${color}`}>{value}</span>
            </div>
          ))}
        </div>

        {/* Bottom-left pulse indicator */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-xs font-mono text-white/30 tracking-wide">Fetch.ai testnet</span>
        </div>
      </div>
    </div>
  );
}
