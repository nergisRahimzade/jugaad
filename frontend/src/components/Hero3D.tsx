"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";
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
  { label: "Agents",   value: "8 live",   color: "text-berkeley-gold" },
  { label: "Network",  value: "testnet",  color: "text-emerald-400"   },
  { label: "Protocol", value: "uAgents",  color: "text-blue-400"      },
  { label: "Domains",  value: "6 active", color: "text-purple-400"    },
];

interface Hero3DProps {
  className?: string;
}

export function Hero3D({ className = "" }: Hero3DProps) {
  const [expanded, setExpanded] = useState(true);

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

        {/* Top-right collapsible live stats panel */}
        <div className="absolute top-4 right-4" style={{ minWidth: "156px" }}>
          {/* Header row — always visible, click to toggle */}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl transition-all"
            style={{
              background: "rgba(5, 8, 16, 0.82)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(253,181,21,0.35)",
              boxShadow: "0 0 0 1px rgba(253,181,21,0.08), 0 2px 12px rgba(0,0,0,0.4)",
            }}
          >
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[9px] font-mono text-white/50 uppercase tracking-widest">Live</span>
            </div>
            {expanded
              ? <ChevronUp  size={11} className="text-white/30 flex-shrink-0" />
              : <ChevronDown size={11} className="text-white/30 flex-shrink-0" />
            }
          </button>

          {/* Collapsible stats body */}
          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div
                  className="mt-1 px-3 py-2.5 rounded-xl space-y-2"
                  style={{
                    background: "rgba(5, 8, 16, 0.82)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(253,181,21,0.35)",
                    boxShadow: "0 0 0 1px rgba(253,181,21,0.08), 0 2px 12px rgba(0,0,0,0.4)",
                  }}
                >
                  {LIVE_STATS.map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between gap-4 text-xs">
                      <span className="text-white/40">{label}</span>
                      <span className={`font-mono font-medium ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
