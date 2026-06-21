import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
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
        {/* Subtle ambient background */}
        <div className="fixed inset-0 pointer-events-none" aria-hidden>
          <div className="grid-bg noise absolute inset-0 opacity-40" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/4 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-berkeley-gold/3 blur-[140px] rounded-full" />
        </div>
        <Navbar />
        <main className="relative pt-16">{children}</main>
      </body>
    </html>
  );
}
