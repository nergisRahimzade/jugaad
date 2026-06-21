"use client";

import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, LogOut, Shield } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { StudentProfileForm } from "./StudentProfileForm";
import { profileCompleteness, userInitials } from "@/lib/profile";

interface ProfilePanelProps {
  onSaved?: () => void;
}

export function ProfilePanel({ onSaved }: ProfilePanelProps) {
  const { user, profile, setProfile, logout, signIn } = useAppState();
  const [draftUser, setDraftUser] = useState({ name: user?.name ?? "", email: user?.email ?? "" });
  const [draftProfile, setDraftProfile] = useState(profile);
  const [saved, setSaved] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    setDraftProfile(profile);
  }, [profile]);

  useEffect(() => {
    if (user) setDraftUser({ name: user.name, email: user.email });
  }, [user]);

  const completeness = profileCompleteness(draftProfile);

  function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setLoginError(null);
    const name = draftUser.name.trim();
    const email = draftUser.email.trim();
    if (!name || !email) {
      setLoginError("Enter your name and email to continue.");
      return;
    }
    if (!email.includes("@")) {
      setLoginError("Enter a valid email address.");
      return;
    }
    signIn({ name, email });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setProfile(draftProfile);
    setSaved(true);
    onSaved?.();
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Sign in */}
      <section className="glass rounded-2xl p-5 border border-white/[0.06]">
        <h2 className="text-sm font-semibold text-white mb-1">Your account</h2>
        <p className="text-xs text-white/40 mb-4">
          Sign in so Jugaad can personalize resources. Data stays on your device.
        </p>

        {user ? (
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: "#003262", color: "#fdb515" }}
            >
              {userInitials(user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{user.name}</p>
              <p className="text-white/40 text-xs truncate">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/50 hover:text-white hover:border-white/20 transition"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        ) : (
          <form onSubmit={handleSignIn} className="space-y-3">
            <input
              type="text"
              value={draftUser.name}
              onChange={(e) => setDraftUser((u) => ({ ...u, name: e.target.value }))}
              placeholder="Full name"
              className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#fdb515]/50"
            />
            <input
              type="email"
              value={draftUser.email}
              onChange={(e) => setDraftUser((u) => ({ ...u, email: e.target.value }))}
              placeholder="berkeley.edu email"
              className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#fdb515]/50"
            />
            {loginError && <p className="text-red-400/80 text-xs">{loginError}</p>}
            <button
              type="submit"
              className="w-full rounded-lg py-2.5 text-sm font-semibold transition hover:opacity-90"
              style={{ background: "#003262", color: "#fdb515" }}
            >
              Sign in
            </button>
          </form>
        )}
      </section>

      {/* Profile completeness */}
      <div className="flex items-center gap-3 px-1">
        <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "#fdb515" }}
            initial={{ width: 0 }}
            animate={{ width: `${completeness}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <span className="text-[11px] font-mono text-white/40 shrink-0">{completeness}% complete</span>
      </div>

      {/* Student profile */}
      <section className="glass rounded-2xl p-5 border border-white/[0.06]">
        <div className="flex items-start gap-2 mb-4">
          <Shield className="h-4 w-4 text-[#fdb515] mt-0.5 shrink-0" />
          <div>
            <h2 className="text-sm font-semibold text-white">Student profile</h2>
            <p className="text-xs text-white/40 mt-0.5">
              Jugaad uses this to match CalFresh, aid appeals, housing, and wellness resources to
              your situation.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile}>
          <StudentProfileForm profile={draftProfile} onChange={setDraftProfile} />
          <button
            type="submit"
            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #fdb515, #ffcc55)",
              color: "#09080f",
            }}
          >
            {saved ? (
              <>
                <Check size={16} /> Saved
              </>
            ) : (
              "Save profile"
            )}
          </button>
        </form>
      </section>
    </div>
  );
}
