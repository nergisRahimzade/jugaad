"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/agents", label: "Fetch.ai Agents" },
  { href: "/demo", label: "Live Demo" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/map", label: "Problem Map" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-berkeley-gold/10 border border-berkeley-gold/30 text-lg transition group-hover:bg-berkeley-gold/20">
            🛠️
          </div>
          <div>
            <span className="font-serif text-xl tracking-tight text-white">Jugaad</span>
            <span className="hidden sm:block text-[10px] uppercase tracking-[0.2em] text-muted -mt-0.5">
              Berkeley AI Hackathon 2026
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(({ href, label }) => {
            const active = pathname === href;
            const isAgents = href === "/agents";
            return (
              <Link
                key={href}
                href={href}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-muted hover:text-white hover:bg-white/5"
                } ${isAgents ? "ring-1 ring-berkeley-gold/40 bg-berkeley-gold/5" : ""}`}
              >
                {isAgents && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-berkeley-gold mr-1.5 animate-pulse" />
                )}
                {label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/demo"
          className="hidden sm:inline-flex items-center gap-2 rounded-full bg-berkeley-gold px-4 py-2 text-sm font-semibold text-berkeley-blue transition hover:bg-[#ffc940] hover:shadow-lg hover:shadow-berkeley-gold/20"
        >
          Try Demo
        </Link>

        <button
          type="button"
          className="md:hidden p-2 text-muted hover:text-white"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/5 px-4 py-3 space-y-1">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm text-muted hover:text-white hover:bg-white/5"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/demo"
            onClick={() => setOpen(false)}
            className="block mt-2 text-center rounded-full bg-berkeley-gold py-2.5 text-sm font-semibold text-berkeley-blue"
          >
            Try Demo
          </Link>
        </div>
      )}
    </header>
  );
}
