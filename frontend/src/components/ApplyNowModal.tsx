"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Loader2, ExternalLink } from "lucide-react";
import { api, StudentProfile, HackItem } from "@/lib/api";

interface ApplyNowModalProps {
  hack: HackItem;
  profile: StudentProfile;
  onClose: () => void;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  personal_statement: "Personal Statement",
  appeal_letter: "Appeal Letter",
  eligibility_summary: "Eligibility Summary",
  scholarship_paragraph: "Scholarship Paragraph",
  action_steps: "Action Plan",
};

export default function ApplyNowModal({ hack, profile, onClose }: ApplyNowModalProps) {
  const [content, setContent] = useState<string | null>(null);
  const [contentType, setContentType] = useState<string>("action_steps");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { generate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.applyNow(profile, hack.id);
      setContent(res.content);
      setContentType(res.content_type);
    } catch {
      setError("Couldn't generate content. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(5, 8, 16, 0.85)", backdropFilter: "blur(8px)" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.2 }}
          className="glass border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-white/5">
            <div>
              <p className="text-xs text-white/40 font-mono uppercase tracking-widest mb-1">
                {CONTENT_TYPE_LABELS[contentType] ?? "Generated Content"}
              </p>
              <h2 className="text-white font-semibold text-lg leading-tight">{hack.name}</h2>
              {hack.dollar_value && (
                <p className="text-berkeley-gold text-sm mt-0.5">{hack.dollar_value}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition ml-4 flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-berkeley-gold" />
                <p className="text-white/40 text-sm">Generating personalized content…</p>
              </div>
            )}

            {error && !loading && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-red-400 text-sm">
                {error}
              </div>
            )}

            {content && !loading && (
              <div className="space-y-4">
                <div
                  className="rounded-xl border border-white/5 bg-white/3 p-4 text-sm text-white/80 leading-relaxed whitespace-pre-wrap font-mono"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  {content}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/5 flex gap-3">
            {hack.url && (
              <a
                href={hack.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-white/70 hover:text-white hover:border-white/20 transition"
              >
                Open Application <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={copy}
              disabled={!content || loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-30 ml-auto"
              style={{ background: "#fdb515", color: "#050810" }}
            >
              {copied ? (
                <><Check className="w-4 h-4" /> Copied!</>
              ) : (
                <><Copy className="w-4 h-4" /> Copy</>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
