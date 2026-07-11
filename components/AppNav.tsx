"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";

const NAV_LINKS = [
  { href: "/tickets", label: "Tickets" },
];

const ADMIN_LINKS = [
  { href: "/admin/articles", label: "Articles" },
];

export function AppNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "admin";

  const allLinks = isAdmin ? [...NAV_LINKS, ...ADMIN_LINKS] : NAV_LINKS;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/tickets" className="font-bold text-foreground tracking-tight flex items-center gap-2">
          <span className="text-primary">✦</span>
          <span>SupportCopilot</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {allLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {session?.user && (
            <span className="hidden md:block text-xs text-muted-foreground">
              {(session.user as any).email}
            </span>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-md px-3 py-1.5 hover:bg-muted"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
