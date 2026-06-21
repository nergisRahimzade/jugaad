"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { api, type HackItem } from "@/lib/api";

const DOMAINS = [
  { id: "food", label: "Food" },
  { id: "housing", label: "Housing" },
  { id: "financial_aid", label: "Financial aid" },
  { id: "scholarship", label: "Scholarship" },
  { id: "wellness", label: "Wellness" },
  { id: "safety", label: "Safety" },
  { id: "academic", label: "Academic" },
];

export default function ContributePage() {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("food");
  const [description, setDescription] = useState("");
  const [howToAccess, setHowToAccess] = useState("");
  const [url, setUrl] = useState("");
  const [handle, setHandle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ id: string; indexed: boolean } | null>(null);
  const [preview, setPreview] = useState<HackItem[] | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await api.contribute({
        name,
        domain,
        description,
        how_to_access: howToAccess,
        url: url.trim() || undefined,
        contributor_handle: handle.trim() || undefined,
      });
      setSuccess({ id: result.id, indexed: result.indexed });
      setName("");
      setDescription("");
      setHowToAccess("");
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadPreview() {
    try {
      const data = await api.previewContributions(domain, 5);
      setPreview(data.results);
    } catch {
      setPreview([]);
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] grid-bg noise">
      <div className="border-b border-white/5 px-6 py-4">
        <div className="max-w-xl mx-auto">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to profile
          </Link>
          <h1 className="text-white font-semibold text-xl">Share a jugaad hack</h1>
          <p className="text-white/40 text-xs mt-1">
            Crowdsource what worked for you — indexed into Redis so future students find it in chat
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto px-4 py-8 space-y-6"
      >
        {success && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 flex gap-2 text-sm text-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Thanks — hack saved as {success.id}</p>
              <p className="text-emerald-200/70 text-xs mt-1">
                {success.indexed
                  ? "Indexed in Redis — it will surface in future RAG searches."
                  : "Saved locally (Redis offline — will index when REDIS_URL is configured)."}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs text-white/50">Hack name</span>
            <input
              required
              minLength={3}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Free produce at Gill Tract"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs text-white/50">Domain</span>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              {DOMAINS.map((d) => (
                <option key={d.id} value={d.id} className="bg-zinc-900">
                  {d.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs text-white/50">What worked?</span>
            <textarea
              required
              minLength={10}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the resource or workaround in plain language"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 resize-none"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs text-white/50">How to access</span>
            <textarea
              required
              minLength={5}
              rows={2}
              value={howToAccess}
              onChange={(e) => setHowToAccess(e.target.value)}
              placeholder="Steps, hours, who to ask, documents needed…"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 resize-none"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs text-white/50">URL (optional)</span>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs text-white/50">Your handle (optional, anonymous ok)</span>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@berkeley_student"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50"
            />
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-medium text-sm py-2.5 transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Submit hack
          </button>
        </form>

        <div className="border-t border-white/5 pt-6">
          <button
            type="button"
            onClick={() => void loadPreview()}
            className="text-xs text-amber-400/80 hover:text-amber-300 transition"
          >
            Preview what Redis returns for this domain →
          </button>
          {preview && (
            <ul className="mt-3 space-y-2">
              {preview.length === 0 ? (
                <li className="text-xs text-white/40">No indexed results yet.</li>
              ) : (
                preview.map((h) => (
                  <li
                    key={h.id}
                    className="text-xs text-white/60 rounded-lg bg-white/5 border border-white/5 px-3 py-2"
                  >
                    <span className="text-white/80 font-medium">{h.name}</span>
                    {h.description && <span> — {h.description.slice(0, 120)}</span>}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </motion.div>
    </main>
  );
}
