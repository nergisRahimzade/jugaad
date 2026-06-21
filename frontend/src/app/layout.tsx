import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { MainContent } from "@/components/MainContent";
import { AppStateProvider } from "@/context/AppStateContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jugaad — Student Resources for UC Berkeley",
  description:
    "Find food, housing, financial aid, mental health, and safety resources matched to your situation — free, fast, and private.",
  keywords: ["Berkeley", "student resources", "food insecurity", "financial aid", "housing"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {/* Ambient background layer */}
        <div className="fixed inset-0 pointer-events-none" aria-hidden>
          <div className="grid-bg noise absolute inset-0 opacity-60" />
          {/* Warm ambient glows */}
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(107,70,193,0.07) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 right-0 w-[500px] h-[400px] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(253,181,21,0.05) 0%, transparent 70%)" }} />
          <div className="absolute top-1/2 left-0 w-[400px] h-[400px] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(52,211,153,0.04) 0%, transparent 70%)" }} />
        </div>
        <AppStateProvider>
          <Navbar />
          <MainContent>{children}</MainContent>
        </AppStateProvider>
      </body>
    </html>
  );
}
