"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen min-h-screen overflow-hidden">
      <a href="#main-content" className="sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:not-sr-only focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-lg">
        Skip to main content
      </a>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-0 flex-1 flex-col lg:overflow-hidden">
        <TopHeader sidebarOpen={sidebarOpen} onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <main id="main-content" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto bg-background p-4 outline-none sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
