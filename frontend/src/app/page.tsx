"use client";

import Link from "next/link";
import { ArrowRight, Heart, Shield, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { Hero3D } from "@/components/Hero3D";

const STATS = [
  { value: "39%", label: "of Berkeley students experience food insecurity" },
  { value: "1 in 5", label: "face housing instability" },
  { value: "$292", label: "average monthly CalFresh benefit" },
  { value: "Free", label: "always — for every Berkeley student" },
];

const HOW_IT_WORKS = [
  {
    icon: Heart,
    color: "#f87171",
    title: "Tell us what's going on",
    desc: "Answer a few short questions about your situation. No judgment, no paperwork — just a conversation.",
  },
  {
    icon: Shield,
    color: "#34d399",
    title: "Get matched to real resources",
    desc: "We find food, housing, money, and mental health support that actually fits your circumstances.",
  },
  {
    icon: BookOpen,
    color: "#a78bfa",
    title: "We help you apply",
    desc: "For every resource, we generate the application letter, eligibility summary, or action steps — ready to copy.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0 },
};

const stagger = {
  show: { transition: { staggerChildren: 0.1 } },
};

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-14 pb-20 lg:pt-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left — text */}
            <motion.div initial="hidden" animate="show" variants={stagger}>

              {/* Eyebrow */}
              <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
                <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs text-white/50 mb-7"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Free for UC Berkeley students
                </div>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeUp}
                transition={{ duration: 0.6 }}
                className="font-serif text-5xl sm:text-6xl lg:text-[4rem] text-white leading-[1.08] tracking-tight"
              >
                You deserve to know{" "}
                <span className="gradient-text">what&apos;s available to you.</span>
              </motion.h1>

              {/* Sub */}
              <motion.p
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="mt-6 text-lg leading-relaxed"
                style={{ color: "#9299ae" }}
              >
                Jugaad finds food assistance, housing support, emergency grants, mental health care, and more — matched to your specific situation in minutes.
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="mt-9 flex flex-wrap gap-3"
              >
                <Link
                  href="/intake"
                  className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold transition-all hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #fdb515, #ffcc55)",
                    color: "#09080f",
                    boxShadow: "0 4px 20px rgba(253,181,21,0.3)",
                  }}
                >
                  Find My Resources <ArrowRight size={16} />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium transition-all hover:bg-white/8"
                  style={{
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  View Dashboard
                </Link>
              </motion.div>

              {/* Stats */}
              <motion.div
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="mt-12 grid grid-cols-2 gap-x-8 gap-y-5"
              >
                {STATS.map(({ value, label }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
                  >
                    <div className="font-serif text-2xl sm:text-3xl" style={{ color: "#fdb515" }}>{value}</div>
                    <div className="text-xs mt-0.5 leading-snug" style={{ color: "#9299ae" }}>{label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — 3D */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <Hero3D />
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-14"
          >
            <h2 className="font-serif text-3xl sm:text-4xl text-white">How it works</h2>
            <p className="mt-3 text-base" style={{ color: "#9299ae" }}>
              Three steps to finding the support you need.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(({ icon: Icon, color, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className="rounded-2xl p-6 transition-all hover:-translate-y-0.5"
                style={{
                  background: "rgba(15,14,24,0.6)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl mb-5"
                  style={{ background: `${color}18` }}
                >
                  <Icon size={20} color={color} />
                </div>
                <h3 className="font-semibold text-white text-base mb-2">{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#9299ae" }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} className="py-24">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <h2 className="font-serif text-3xl sm:text-4xl text-white mb-4">
              39% of Berkeley students experience food insecurity.
            </h2>
            <p className="text-base mb-8" style={{ color: "#9299ae" }}>
              Most never find out what they&apos;re eligible for. Jugaad fixes that — in a 5-minute conversation.
            </p>
            <Link
              href="/intake"
              className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #fdb515, #ffcc55)",
                color: "#09080f",
                boxShadow: "0 4px 24px rgba(253,181,21,0.3)",
              }}
            >
              Find My Resources — It&apos;s Free <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }} className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm" style={{ color: "#9299ae" }}>
          <span className="font-semibold text-white">Jugaad</span>
          <span>UC Berkeley AI Hackathon 2026 · Free for all students</span>
        </div>
      </footer>
    </>
  );
}
