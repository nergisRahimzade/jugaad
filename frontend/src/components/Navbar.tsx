"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, User, X } from "lucide-react";
import { profileCompleteness, userInitials } from "@/lib/profile";
import { useAppState } from "@/context/AppStateContext";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Chat" },
  { href: "/agents", label: "How It Works" },
];

function ProfileButton({ onClick, compact }: { onClick?: () => void; compact?: boolean }) {
  const { user, profile } = useAppState();
  const complete = profileCompleteness(profile);
  const signedIn = !!user;

  const inner = (
    <>
      {signedIn ? (
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
          style={{ background: "#003262", color: "#fdb515" }}
        >
          {userInitials(user.name)}
        </span>
      ) : (
        <User size={20} />
      )}
      {!compact && signedIn && (
        <span className="hidden sm:block text-xs text-white/60 max-w-[100px] truncate">
          {user.name.split(" ")[0]}
        </span>
      )}
      <span
        className={`absolute bottom-0.5 right-0.5 h-2 w-2 rounded-full border border-[#09080f] ${
          !signedIn ? "bg-white/25" : complete >= 80 ? "bg-emerald-400" : "bg-[#fdb515]"
        }`}
        aria-hidden
      />
    </>
  );

  const className =
    "relative flex items-center gap-2 rounded-full border border-white/10 p-1.5 sm:px-2.5 sm:py-1.5 text-white/60 hover:text-white hover:border-white/20 hover:bg-white/5 transition";

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className} aria-label="Profile">
        {inner}
      </button>
    );
  }

  return (
    <Link href="/profile" className={className} aria-label="Profile">
      {inner}
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: "rgba(9, 8, 15, 0.8)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 gap-3">
        <Link href="/" className="group shrink-0">
          <span className="font-semibold text-lg text-white tracking-tight">Jugaad</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                isActive(href)
                  ? "text-white bg-white/8"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <ProfileButton />
          <button
            type="button"
            className="md:hidden p-2 text-white/50 hover:text-white transition"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

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
              className={`block px-3 py-2.5 rounded-xl text-sm transition ${
                isActive(href)
                  ? "text-white bg-white/8"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition"
          >
            Profile
          </Link>
        </div>
      )}
    </header>
  );
}
