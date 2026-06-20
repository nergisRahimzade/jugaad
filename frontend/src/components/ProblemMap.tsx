"use client";

import { motion } from "framer-motion";

const PROBLEM_ZONES = [
  { id: "southside", label: "Southside", x: 62, y: 58, food: 89, safety: 72, aid: 65, size: 48 },
  { id: "telegraph", label: "Telegraph", x: 55, y: 45, food: 45, safety: 91, aid: 40, size: 40 },
  { id: "unit2", label: "Unit 2", x: 48, y: 52, food: 55, safety: 68, aid: 50, size: 36 },
  { id: "downtown", label: "Downtown", x: 70, y: 42, food: 38, safety: 55, aid: 78, size: 32 },
  { id: "northside", label: "Northside", x: 42, y: 35, food: 28, safety: 35, aid: 42, size: 28 },
  { id: "campus", label: "Campus Core", x: 50, y: 48, food: 62, safety: 45, aid: 85, size: 44 },
];

const STATS = [
  { label: "Food insecurity reports", value: "847", trend: "+12% this week", color: "#34D399" },
  { label: "Safety concerns (after 10pm)", value: "234", trend: "Telegraph peak", color: "#F87171" },
  { label: "Financial aid anxiety", value: "1.2k", trend: "Post-FAFSA pause", color: "#A78BFA" },
  { label: "CAPS wait frustration", value: "412", trend: "3+ week waits", color: "#E879F9" },
];

export function ProblemMap() {
  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-xl p-4"
          >
            <div className="text-2xl font-serif text-white">{stat.value}</div>
            <div className="text-xs text-muted mt-1">{stat.label}</div>
            <div className="text-[10px] font-mono mt-2" style={{ color: stat.color }}>
              {stat.trend}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Map visualization */}
      <div className="glass rounded-2xl p-4 sm:p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Berkeley Problem Map</h3>
            <p className="text-sm text-muted">Live crowdsourced student struggles · anonymous reports</p>
          </div>
          <div className="flex gap-3 text-[10px] font-mono">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400/60" /> Food</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400/60" /> Safety</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-400/60" /> Aid</span>
          </div>
        </div>

        <div className="relative aspect-[16/10] rounded-xl bg-[#0a1628] border border-white/5 overflow-hidden grid-bg">
          {/* Simplified campus outline */}
          <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100">
            <path
              d="M30 25 L70 20 L85 45 L75 75 L40 80 L20 55 Z"
              fill="none"
              stroke="#003262"
              strokeWidth="0.5"
            />
            <text x="45" y="50" fill="#8892a8" fontSize="3" textAnchor="middle">UC Berkeley</text>
          </svg>

          {PROBLEM_ZONES.map((zone, i) => (
            <motion.div
              key={zone.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
            >
              <div
                className="rounded-full animate-pulse"
                style={{
                  width: zone.size,
                  height: zone.size,
                  background: `radial-gradient(circle, rgba(253,181,21,${zone.food / 200}) 0%, rgba(248,113,113,${zone.safety / 300}) 50%, transparent 70%)`,
                }}
              />
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 opacity-0 group-hover:opacity-100 transition glass rounded-lg px-2 py-1 text-[10px] whitespace-nowrap z-10">
                <div className="font-semibold text-white">{zone.label}</div>
                <div className="text-muted">Food {zone.food}% · Safety {zone.safety}% · Aid {zone.aid}%</div>
              </div>
            </motion.div>
          ))}

          {/* MLK marker */}
          <div className="absolute left-[52%] top-[50%] -translate-x-1/2 -translate-y-1/2">
            <div className="flex flex-col items-center">
              <span className="text-lg">📍</span>
              <span className="text-[9px] font-mono text-berkeley-gold bg-black/60 px-1.5 rounded">MLK Food Pantry</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
