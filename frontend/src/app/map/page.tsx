import { ProblemMap } from "@/components/ProblemMap";

export const metadata = {
  title: "Berkeley Problem Map — Jugaad",
  description: "Live crowdsourced visualization of student struggles across campus",
};

export default function MapPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
      <div className="mb-8">
        <p className="text-xs text-white/30 uppercase tracking-wider mb-2">Advocacy Tool</p>
        <h1 className="font-serif text-3xl sm:text-4xl text-white">
          Where students are struggling
        </h1>
        <p className="mt-2 text-white/50 max-w-2xl">
          Anonymous reports from Berkeley students, aggregated in real time — to help individuals find support and surface patterns for systemic change.
        </p>
      </div>

      <ProblemMap />
    </div>
  );
}
