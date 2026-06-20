import { HackStackCards } from "@/components/HackStackCards";

export const metadata = {
  title: "Dashboard — Jugaad",
  description: "Personalized resource stacks ranked by urgency and match confidence",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-muted uppercase tracking-wider mb-2">Your Dashboard</p>
          <h1 className="font-serif text-3xl sm:text-4xl text-white">
            Matched Resources
          </h1>
          <p className="mt-2 text-muted max-w-xl">
            Resources matched to your profile by specialist Fetch.ai agents — ranked by deadline,
            dollar value, and effort.
          </p>
        </div>

        {/* Profile summary */}
        <div className="glass rounded-xl px-4 py-3 text-sm shrink-0">
          <div className="text-xs text-muted font-mono mb-1">Student Profile</div>
          <div className="text-white font-medium">Sophomore · CS · Off-campus</div>
          <div className="text-xs text-muted mt-1">4 resource stacks · 12 resources matched</div>
        </div>
      </div>

      <HackStackCards />
    </div>
  );
}
