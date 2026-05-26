"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import StreakBadge from "@/components/StreakBadge";

const navLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Chat", href: "/chat" },
  { label: "Quiz", href: "/quiz" },
  { label: "Progress", href: "/progress" },
  { label: "Trending", href: "/trending" },
  { label: "History", href: "/history" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        height: 56,
        background: "rgba(249,247,243,0.94)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* Main bar */}
      <div className="flex h-14 items-center justify-between px-4 lg:px-6">
        {/* Left: Logo */}
        <Link
          href="/"
          className="shrink-0 font-serif text-[19px]"
          style={{ color: "var(--text-primary)" }}
        >
          EduMind
        </Link>

        {/* Center: Desktop nav links */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-3 py-1.5 font-sans text-[14px] transition-colors duration-150"
                style={{
                  color: active
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                  fontWeight: active ? 500 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!active)
                    e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  if (!active)
                    e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                {link.label}
                {/* Active dot indicator */}
                {active && (
                  <span
                    className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full"
                    style={{ background: "var(--accent)" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: streak + auth */}
        <div className="flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <button
                className="hidden cursor-pointer font-sans text-[14px] transition-colors duration-150 hover:text-[var(--text-primary)] md:block"
                style={{ color: "var(--text-secondary)" }}
              >
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                className="hidden cursor-pointer rounded-lg px-4 py-[9px] font-sans text-[14px] font-medium text-white transition-all duration-150 hover:-translate-y-[1px] md:block"
                style={{
                  background: "var(--accent)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                Sign Up
              </button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <StreakBadge />
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            >
              <UserButton.MenuItems>
                <UserButton.Link
                  label="My Profile"
                  labelIcon={<span>{"\u2699\uFE0F"}</span>}
                  href="/profile"
                />
              </UserButton.MenuItems>
            </UserButton>
          </SignedIn>

          {/* Mobile hamburger */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-[var(--bg-muted)] md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" style={{ color: "var(--text-primary)" }} />
            ) : (
              <Menu
                className="h-5 w-5"
                style={{ color: "var(--text-primary)" }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <nav
          className="border-t px-6 pb-4 pt-2 md:hidden"
          style={{
            borderColor: "var(--border)",
            background: "var(--bg-base)",
          }}
        >
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 font-sans text-[14px] transition-colors duration-150"
                style={{
                  color: active
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                  fontWeight: active ? 500 : 400,
                  background: active ? "var(--bg-muted)" : "transparent",
                }}
              >
                {active && (
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: "var(--accent)" }}
                  />
                )}
                {link.label}
              </Link>
            );
          })}

          {/* Mobile auth fallback */}
          <SignedOut>
            <div
              className="mt-3 border-t pt-3"
              style={{ borderColor: "var(--border)" }}
            >
              <SignInButton mode="modal">
                <button
                  className="block w-full cursor-pointer rounded-lg px-3 py-2.5 text-left font-sans text-[14px] transition-colors duration-150"
                  style={{ color: "var(--text-secondary)" }}
                  onClick={() => setMobileOpen(false)}
                >
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button
                  className="mt-1 block w-full cursor-pointer rounded-lg px-3 py-2.5 text-center font-sans text-[14px] font-medium text-white"
                  style={{ background: "var(--accent)" }}
                  onClick={() => setMobileOpen(false)}
                >
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          </SignedOut>
        </nav>
      )}
    </header>
  );
}
