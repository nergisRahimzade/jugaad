import { FetchAIDemoSection } from "@/components/FetchAIDemoSection";

export const metadata = {
  title: "How It Works — Jugaad",
  description: "Live multi-agent orchestration: coordinator + 7 specialists with cross-domain routing",
};

export default function AgentsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
      <FetchAIDemoSection />
    </div>
  );
}
