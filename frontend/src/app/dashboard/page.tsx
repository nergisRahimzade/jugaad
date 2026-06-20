"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import RealDashboard from "@/components/RealDashboard";
import { StudentProfile } from "@/lib/api";

export default function DashboardPage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("jugaad_profile");
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch {
        // corrupted — ignore
      }
    }
    setChecked(true);
  }, []);

  if (!checked) return null;

  if (!profile) {
    return (
      <main className="min-h-screen grid-bg noise flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl border border-white/10 p-8 max-w-md text-center"
        >
          <div className="text-4xl mb-4">🛠️</div>
          <h1 className="text-white font-semibold text-xl mb-2">No profile found</h1>
          <p className="text-white/50 text-sm mb-6">
            Complete the intake interview first so Jugaad can match resources to your exact situation.
          </p>
          <Link
            href="/intake"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition"
            style={{ background: "#fdb515", color: "#050810" }}
          >
            Start Intake Interview <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen grid-bg noise">
      <div className="max-w-3xl mx-auto px-4 py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-6">
            <h1 className="font-serif text-3xl text-white">Your hack stack</h1>
            <p className="text-white/40 text-sm mt-1">
              Personalized to your situation — ranked by value and urgency.
            </p>
          </div>

          <RealDashboard profile={profile} />
        </motion.div>
      </div>
    </main>
  );
}
