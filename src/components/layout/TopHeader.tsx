"use client";

import { MdMenu, MdSearch, MdNotificationsNone, MdPerson } from "react-icons/md";
import Link from "next/link";

interface TopHeaderProps {
  onMenuToggle: () => void;
}

export default function TopHeader({ onMenuToggle }: TopHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background px-4 shadow-sm">
      {/* Mobile menu button */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Toggle navigation"
      >
        <MdMenu size={22} />
      </button>

      {/* Search */}
      <form action="/search" method="get" role="search" className="flex flex-1 items-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5 max-w-md">
        <MdSearch size={18} className="shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          name="q"
          placeholder="Search products, references, contacts..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          aria-label="Global search"
        />
      </form>

      <div className="ml-auto flex items-center gap-1">
        {/* Notifications */}
        <Link
          href="/notifications"
          className="relative rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Notifications"
        >
          <MdNotificationsNone size={22} />
        </Link>

        {/* Profile */}
        <Link
          href="/profile"
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="My profile"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-lemon)] text-[var(--color-lemon-foreground)]">
            <MdPerson size={16} />
          </span>
        </Link>
      </div>
    </header>
  );
}
