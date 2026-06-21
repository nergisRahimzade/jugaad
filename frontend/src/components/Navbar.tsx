"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User } from "lucide-react";
import { profileCompleteness, userInitials } from "@/lib/profile";
import { useAppState } from "@/context/AppStateContext";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Chat" },
  { href: "/history", label: "History" },
  { href: "/resources", label: "Resources" },
  { href: "/agents", label: "How It Works" },
];

function ProfileButton() {
  const { user, profile } = useAppState();
  const complete = profileCompleteness(profile);
  const signedIn = !!user;

  return (
    <Link
      href="/profile"
      className="relative flex items-center gap-2 rounded-full border border-white/10 p-1.5 sm:px-2.5 sm:py-1.5 text-white/60 hover:text-white hover:border-white/20 hover:bg-white/5 transition shrink-0"
      aria-label="Profile"
    >
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
      {signedIn && (
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
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();

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
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="shrink-0">
          <span className="font-semibold text-lg text-white tracking-tight">Jugaad</span>
        </Link>

        <nav className="flex flex-1 items-center justify-center gap-0.5 sm:gap-1 min-w-0">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`whitespace-nowrap px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-all ${
                isActive(href)
                  ? "text-white bg-white/8"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <ProfileButton />
      </div>
    </header>
  );
}
