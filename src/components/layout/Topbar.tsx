"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Maximize2, Minimize2, LogOut, Menu, X, Command, MonitorPlay } from "lucide-react";
import { useLayout } from "@/context/LayoutContext";
import { useVertical } from "@/context/VerticalContext";
import { usePresentation } from "@/context/PresentationContext";
import { VerticalSwitcher } from "./VerticalSwitcher";
import { LiveClock } from "./LiveClock";
import { cn } from "@/lib/utils";

export function Topbar({ onOpenCommand }: { onOpenCommand?: () => void }) {
  const { isFullscreen, toggleFullscreen, userRole, isSidebarOpen, setSidebarOpen } = useLayout();
  const { config } = useVertical();
  const { isPresenting, toggle: togglePresentation } = usePresentation();
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/login", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }, [router]);

  return (
    <header className="glass sticky top-0 z-40 flex h-16 w-full flex-shrink-0 items-center justify-between border-x-0 border-t-0 rounded-none px-4 md:px-6">
      <div className="flex items-center gap-3 md:gap-5">
        <button
          className="rounded-xl p-2 text-[var(--text-dim)] transition-colors hover:bg-white/5 md:hidden"
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          aria-label="Abrir menú"
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="hidden items-center gap-2.5 md:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl accent-bg text-black font-black neon-glow">
            C
          </div>
          <div className="leading-tight">
            <p className="text-sm font-black tracking-tight text-[var(--text)]">CUSTOS</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-faint)]">
              Centro de Mando
            </p>
          </div>

          {/* by LinkTIC */}
          <div className="ml-2 flex items-center gap-1.5 border-l border-white/10 pl-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-faint)]">
              by
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/linktic-logo.svg" alt="LinkTIC" className="h-7 w-auto" />
            <span className="text-sm font-bold text-[var(--text)]">LinkTIC</span>
          </div>
        </div>

        <div className="mx-1 hidden h-8 w-px bg-white/10 md:block" />

        {/* Selector CNE / AE */}
        <VerticalSwitcher />
      </div>

      <div className="flex items-center gap-2">
        <LiveClock />

        <button
          onClick={onOpenCommand}
          className="hidden items-center gap-2 rounded-xl glass px-3 py-2 text-xs font-semibold text-[var(--text-dim)] transition-colors hover:neon-border md:flex"
          title="Paleta de comandos (Ctrl/Cmd + K)"
        >
          <Command className="h-3.5 w-3.5" />
          <span>Buscar</span>
          <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">⌘K</kbd>
        </button>

        <div
          className="hidden rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-tight md:block"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          {userRole === "viewer" ? "Modo lectura" : "Modo admin"}
        </div>

        <button
          onClick={togglePresentation}
          className={cn(
            "rounded-xl p-2 transition-all",
            isPresenting
              ? "neon-border text-[var(--accent)]"
              : "text-[var(--text-dim)] hover:bg-white/5 hover:text-[var(--accent)]"
          )}
          style={isPresenting ? { background: "var(--accent-soft)" } : undefined}
          title="Modo presentación (rota módulos en pantalla completa)"
        >
          <MonitorPlay className="h-5 w-5" />
        </button>

        <button
          onClick={toggleFullscreen}
          className="rounded-xl p-2 text-[var(--text-dim)] transition-all hover:bg-white/5 hover:text-[var(--accent)]"
          title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
        >
          {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </button>

        <button
          onClick={handleLogout}
          className="rounded-xl p-2 text-[var(--text-dim)] transition-all hover:bg-rose-500/10 hover:text-rose-400"
          title="Cerrar sesión"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
