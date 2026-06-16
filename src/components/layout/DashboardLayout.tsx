"use client";

import React, { useEffect, useState } from "react";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";
import { CommandPalette } from "./CommandPalette";
import { PageTransition } from "./PageTransition";
import { NavProgress } from "./NavProgress";
import { AccessSync } from "./AccessSync";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      <AccessSync />
      <NavProgress />
      <Topbar onOpenCommand={() => setCmdOpen(true)} />
      <div className="relative flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}
