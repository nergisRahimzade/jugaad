import { FetchAIDemoSection } from "@/components/FetchAIDemoSection";

export const metadata = {
  title: "Fetch.ai Agents — Jugaad",
  description: "8 uAgents on Agentverse: Coordinator + 7 specialists with Band cross-domain intelligence",
};

export default function AgentsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
      <FetchAIDemoSection />
    </div>
  );
}
