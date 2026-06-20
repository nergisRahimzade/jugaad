"use client";

import dynamic from "next/dynamic";

const ModelCanvas = dynamic(() => import("./ModelCanvas").then((m) => m.ModelCanvas), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-surface/50">
      <div className="text-center space-y-3">
        <div className="mx-auto h-12 w-12 rounded-full border-2 border-berkeley-gold/30 border-t-berkeley-gold animate-spin" />
        <p className="text-sm text-muted font-mono">Loading 3D scene…</p>
      </div>
    </div>
  ),
});

interface Hero3DProps {
  className?: string;
}

export function Hero3D({ className = "" }: Hero3DProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Glow backdrop */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-berkeley-gold/10 via-transparent to-blue-500/10 blur-3xl" />

      {/* 3D viewport — drop your GLB/OBJ model here via ModelCanvas */}
      <div className="relative h-[320px] sm:h-[400px] lg:h-[480px] w-full rounded-2xl border border-white/10 bg-surface/80 overflow-hidden glow-gold">
        <ModelCanvas />

        {/* Corner badge */}
        <div className="absolute bottom-4 left-4 glass rounded-lg px-3 py-1.5 text-xs font-mono text-muted">
          <span className="text-berkeley-gold">●</span> 3D model slot — replace with your asset
        </div>

        {/* Floating stats */}
        <div className="absolute top-4 right-4 glass rounded-xl px-4 py-3 space-y-2 min-w-[140px]">
          <div className="flex justify-between text-xs">
            <span className="text-muted">Agents</span>
            <span className="font-mono text-berkeley-gold">8 live</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted">Network</span>
            <span className="font-mono text-emerald-400">testnet</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted">Protocol</span>
            <span className="font-mono text-blue-400">uAgents</span>
          </div>
        </div>
      </div>
    </div>
  );
}
