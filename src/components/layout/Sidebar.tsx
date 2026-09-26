"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  MdDashboard,
  MdInventory2,
  MdWarehouse,
  MdHistory,
  MdExpandMore,
  MdExpandLess,
  MdSwapHoriz,
  MdTune,
  MdLogout,
  MdPerson,
  MdClose,
} from "react-icons/md";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: { label: string; href: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: <MdDashboard size={20} /> },
  { label: "Products", href: "/products", icon: <MdInventory2 size={20} /> },
  { label: "Stock", href: "/stock", icon: <MdWarehouse size={20} /> },
  {
    label: "Operations",
    icon: <MdSwapHoriz size={20} />,
    children: [
      { label: "Receipts", href: "/operations/receipts" },
      { label: "Delivery Orders", href: "/operations/delivery-orders" },
      { label: "Internal Transfers", href: "/operations/internal-transfers" },
      { label: "Stock Adjustments", href: "/operations/adjustments" },
    ],
  },
  { label: "Move History", href: "/move-history", icon: <MdHistory size={20} /> },
  {
    label: "Settings",
    icon: <MdTune size={20} />,
    children: [
      { label: "Warehouses", href: "/settings/warehouses" },
      { label: "Locations", href: "/settings/locations" },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => ({
    Operations: true,
    Settings: pathname.startsWith("/settings"),
  }));

  function toggleGroup(label: string) {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        id="primary-sidebar"
        className={`
          fixed inset-y-0 left-0 z-30 flex w-60 flex-col
          bg-sidebar text-sidebar-foreground
          border-r border-sidebar-border
          transition-transform duration-200
          lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
        aria-label="Main navigation"
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
            <Image
              src="/lemon_logo.png"
              alt="Lemon"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
              priority
              unoptimized
            />
            <span className="text-lg font-semibold tracking-tight text-white">
              Lemon
            </span>
          </Link>
          <button
            className="lg:hidden text-sidebar-foreground hover:text-white"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5" aria-label="Sidebar">
          {NAV_ITEMS.map((item) => {
            if (item.children) {
              const groupActive = item.children.some((c) => isActive(c.href));
              const isOpen = expanded[item.label];
              return (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(item.label)}
                    aria-expanded={isOpen}
                    aria-controls={`sidebar-group-${item.label.toLowerCase()}`}
                    className={`
                      flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium
                      transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                      ${groupActive ? "text-sidebar-primary" : "text-sidebar-foreground"}
                    `}
                  >
                    <span className="flex items-center gap-3">
                      {item.icon}
                      {item.label}
                    </span>
                    {isOpen ? <MdExpandLess size={16} /> : <MdExpandMore size={16} />}
                  </button>

                  <div
                    id={`sidebar-group-${item.label.toLowerCase()}`}
                    hidden={!isOpen}
                    className="ml-8 mt-0.5 space-y-0.5"
                  >
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onClose}
                        aria-current={isActive(child.href) ? "page" : undefined}
                        className={`
                          block rounded-md px-3 py-1.5 text-sm transition-colors
                          hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                          ${isActive(child.href)
                            ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                            : "text-sidebar-foreground"
                          }
                        `}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href!}
                onClick={onClose}
                aria-current={isActive(item.href!) ? "page" : undefined}
                className={`
                  flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium
                  transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                  ${isActive(item.href!)
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground"
                  }
                `}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Profile + Logout */}
        <div className="border-t border-sidebar-border px-3 py-3 space-y-0.5">
          <Link
            href="/profile"
            onClick={onClose}
            aria-current={isActive("/profile") ? "page" : undefined}
            className={`
              flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium
              transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
              ${isActive("/profile")
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground"
              }
            `}
          >
            <MdPerson size={20} />
            Profile
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium
              text-sidebar-foreground transition-colors
              hover:bg-red-500/10 hover:text-red-400"
          >
            <MdLogout size={20} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
