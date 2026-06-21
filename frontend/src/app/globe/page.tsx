import Berkeley3DGlobe from "@/components/Berkeley3DGlobe";

export const metadata = {
  title: "Issue Agents — Jugaad",
  description: "Rotating flashcard carousel of UC Berkeley issue agents",
};

export default function GlobePage() {
  return (
    <div className="mx-auto max-w-[1600px] px-3 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 px-1">
        <p className="text-xs font-mono uppercase tracking-widest text-[#fdb515]">Campus Agents</p>
        <h1 className="mt-1 font-serif text-2xl text-white sm:text-3xl">
          Explore Berkeley by issue agent
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/50">
          Flashcards rotate in a circle — pick an agent on the left to bring its card to the front
          and highlight it.
        </p>
      </div>
      <Berkeley3DGlobe />
    </div>
  );
}
