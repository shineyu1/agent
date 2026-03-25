"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LanguageToggle } from "./language-toggle";
import { useLanguage } from "./language-provider";
import { siteCopy } from "@/lib/content/site-copy";

type SiteSession = {
  role: "buyer" | "seller";
  walletAddress: string;
};

function shortenWallet(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function SiteShell({
  children,
  session
}: {
  children: ReactNode;
  session?: SiteSession | null;
}) {
  const { language } = useLanguage();
  const copy = siteCopy[language];
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: copy.nav.home },
    { href: "/directory", label: copy.nav.directory },
    { href: "/providers", label: copy.nav.providers }
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>
      <header
        className="sticky top-0 z-40"
        style={{
          borderBottom: "1px solid var(--border)",
          background: "rgba(9,9,11,0.88)",
          backdropFilter: "blur(20px)"
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <span className="grid grid-cols-2 gap-[3px]">
                <span className="h-[5px] w-[5px] rounded-[2px] bg-white" />
                <span className="h-[5px] w-[5px] rounded-[2px] bg-white" />
                <span className="h-[5px] w-[5px] rounded-[2px] bg-white" />
                <span className="h-[5px] w-[5px] rounded-[2px] bg-white" />
              </span>
            </span>
            <span className="text-sm font-semibold tracking-tight text-white">SellerOS</span>
          </Link>

          {/* Nav */}
          <nav className="hidden items-center gap-6 text-sm md:flex">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="no-underline transition-colors"
                  style={{ color: isActive ? "#ffffff" : "var(--muted)" }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {session && (
              <span
                className="hidden rounded-full px-3 py-1 text-xs font-medium sm:inline-flex"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)" }}
              >
                {session.role === "seller" ? copy.session.seller : copy.session.buyer}{" "}
                {shortenWallet(session.walletAddress)}
              </span>
            )}
            <LanguageToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
