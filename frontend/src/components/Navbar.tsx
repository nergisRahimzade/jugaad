"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/intake", label: "Get Help" },
  { href: "/dashboard", label: "My Resources" },
  { href: "/agents", label: "How It Works" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: "rgba(9, 8, 15, 0.8)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold transition-all group-hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #fdb515, #ffcc55)",
              color: "#09080f",
              boxShadow: "0 2px 12px rgba(253,181,21,0.3)",
            }}
          >
            J
          </div>
          <span className="font-semibold text-lg text-white tracking-tight">Jugaad</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  active
                    ? "text-white bg-white/8"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* CTA */}
        <Link
          href="/intake"
          className="hidden sm:inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #fdb515, #ffcc55)",
            color: "#09080f",
            boxShadow: "0 2px 16px rgba(253,181,21,0.25)",
          }}
        >
          Get Help Free
        </Link>

        {/* Mobile toggle */}
        <button
          type="button"
          className="md:hidden p-2 text-white/50 hover:text-white transition"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden px-4 py-3 space-y-1"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/intake"
            onClick={() => setOpen(false)}
            className="block mt-3 text-center rounded-full py-2.5 text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #fdb515, #ffcc55)", color: "#09080f" }}
          >
            Get Help Free
          </Link>
        </div>
      )}
    </header>
  );
}
