import { ProblemMap } from "@/components/ProblemMap";

export const metadata = {
  title: "Berkeley Problem Map — Jugaad",
  description: "Live crowdsourced visualization of student struggles across campus",
};

export default function MapPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
      <div className="mb-8">
        <p className="text-xs font-mono text-muted uppercase tracking-wider mb-2">Advocacy Tool</p>
        <h1 className="font-serif text-3xl sm:text-4xl text-white">
          Berkeley Problem Map
        </h1>
        <p className="mt-2 text-muted max-w-2xl">
          Students report struggles anonymously. Jugaad aggregates into real-time crisis data —
          for individual navigation and systemic advocacy.
        </p>
      </div>

      <ProblemMap />
    </div>
  );
}
