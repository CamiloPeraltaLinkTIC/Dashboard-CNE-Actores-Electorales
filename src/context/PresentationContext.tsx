"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MonitorPlay } from "lucide-react";
import { useVertical } from "./VerticalContext";
import { modulesFor } from "@/lib/verticals";

interface PresentationContextType {
  isPresenting: boolean;
  toggle: () => void;
}

const PresentationContext = createContext<PresentationContextType | undefined>(undefined);

const INTERVAL_MS = 12000;

export function PresentationProvider({ children }: { children: React.ReactNode }) {
  const [isPresenting, setIsPresenting] = useState(false);
  const router = useRouter();
  const { vertical } = useVertical();
  const idxRef = useRef(0);

  const toggle = useCallback(() => setIsPresenting((v) => !v), []);

  // Rotación automática entre los módulos del vertical, en pantalla completa.
  useEffect(() => {
    if (!isPresenting) return;
    if (typeof document !== "undefined" && !document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    }
    const paths = modulesFor(vertical).map((m) => m.path);
    if (paths.length === 0) return;
    idxRef.current = 0;
    router.push(paths[0]);
    const id = setInterval(() => {
      idxRef.current = (idxRef.current + 1) % paths.length;
      router.push(paths[idxRef.current]);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [isPresenting, vertical, router]);

  // Salir con ESC o al cerrar pantalla completa.
  useEffect(() => {
    if (!isPresenting) return;
    const onFs = () => {
      if (!document.fullscreenElement) setIsPresenting(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsPresenting(false);
    };
    document.addEventListener("fullscreenchange", onFs);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      window.removeEventListener("keydown", onKey);
    };
  }, [isPresenting]);

  // Al apagar, salir de pantalla completa si seguimos en ella.
  useEffect(() => {
    if (!isPresenting && typeof document !== "undefined" && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }, [isPresenting]);

  return (
    <PresentationContext.Provider value={{ isPresenting, toggle }}>
      {children}
      {isPresenting && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong neon-border fixed bottom-5 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-3 rounded-full px-4 py-2"
        >
          <MonitorPlay className="h-4 w-4" style={{ color: "var(--accent)" }} />
          <span className="text-xs font-bold text-[var(--text)]">Modo presentación</span>
          <span className="h-1.5 w-1.5 rounded-full animate-pulse-glow" style={{ background: "var(--accent)" }} />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-faint)]">
            ESC para salir
          </span>
        </motion.div>
      )}
    </PresentationContext.Provider>
  );
}

export function usePresentation() {
  const ctx = useContext(PresentationContext);
  if (!ctx) throw new Error("usePresentation debe usarse dentro de PresentationProvider");
  return ctx;
}
