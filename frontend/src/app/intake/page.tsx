"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import IntakeChat from "@/components/IntakeChat";
import { StudentProfile } from "@/lib/api";

export default function IntakePage() {
  const router = useRouter();

  function handleComplete(p: StudentProfile) {
    // Store profile in sessionStorage so the dashboard can pick it up
    sessionStorage.setItem("jugaad_profile", JSON.stringify(p));
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen grid-bg noise flex flex-col">
      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <span className="text-2xl">🛠️</span>
          <div>
            <h1 className="text-white font-semibold leading-tight">Jugaad</h1>
            <p className="text-white/40 text-xs">
              Tell me your situation — I&apos;ll find the hacks that apply to you.
            </p>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden px-4 py-6">
        <div className="flex-1 max-w-2xl mx-auto w-full flex flex-col overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <IntakeChat onComplete={handleComplete} />
          </motion.div>
        </div>
      </div>

      {/* Footer note */}
      <div className="border-t border-white/5 px-6 py-3">
        <p className="text-center text-white/20 text-xs max-w-md mx-auto">
          Your answers stay private and are only used to match you with resources.
          39% of Berkeley undergrads experience food insecurity — you&apos;re not alone.
        </p>
      </div>
    </main>
  );
}
