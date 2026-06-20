import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jugaad — AI Student Resources for Berkeley",
  description:
    "Voice-powered multi-agent platform matching Berkeley students to food, housing, financial aid, wellness, and safety resources.",
  keywords: ["Berkeley", "AI", "Fetch.ai", "student resources", "hackathon"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased font-sans">
        <div className="fixed inset-0 grid-bg noise pointer-events-none opacity-50" />
        <Navbar />
        <main className="relative pt-16">{children}</main>
      </body>
    </html>
  );
}
