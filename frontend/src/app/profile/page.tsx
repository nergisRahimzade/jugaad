"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { ProfilePanel } from "@/components/ProfilePanel";

export default function ProfilePage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] grid-bg noise">
      <div className="border-b border-white/5 px-6 py-4">
        <div className="max-w-xl mx-auto">
          <Link
            href="/chat"
            className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to chat
          </Link>
          <h1 className="text-white font-semibold text-xl">Profile</h1>
          <p className="text-white/40 text-xs mt-1">
            Sign in and tell Jugaad about your situation for personalized resource matching
          </p>
          <Link
            href="/contribute"
            className="inline-block mt-3 text-xs text-amber-400/80 hover:text-amber-300 transition"
          >
            Share a jugaad hack you discovered →
          </Link>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto px-4 py-8"
      >
        <ProfilePanel />
      </motion.div>
    </main>
  );
}
