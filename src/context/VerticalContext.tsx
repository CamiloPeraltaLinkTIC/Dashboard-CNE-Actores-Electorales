"use client";

import React, { createContext, useContext, useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { VERTICALS, type VerticalId, type VerticalDef, equivalentPath } from "@/lib/verticals";

interface VerticalContextType {
  vertical: VerticalId;
  config: VerticalDef;
  isSwitching: boolean;
  /** Cambia de vertical: persiste cookie, navega al módulo equivalente y re-tematiza. */
  switchVertical: (id: VerticalId, currentSlug?: string) => void;
  /** Sincroniza el vertical activo SIN navegar (usado al entrar por URL directa). */
  syncVertical: (id: VerticalId) => void;
}

const VerticalContext = createContext<VerticalContextType | undefined>(undefined);

export function VerticalProvider({
  children,
  initialVertical,
}: {
  children: React.ReactNode;
  initialVertical: VerticalId;
}) {
  const [vertical, setVertical] = useState<VerticalId>(initialVertical);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const switchVertical = useCallback(
    (id: VerticalId, currentSlug?: string) => {
      if (id === vertical) return;
      setVertical(id);
      // Re-tematiza de inmediato (sin esperar al servidor)
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-vertical", id);
      }
      // Persiste para SSR
      fetch("/api/vertical", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vertical: id }),
      }).catch(() => {});
      startTransition(() => {
        router.push(equivalentPath(id, currentSlug));
      });
    },
    [vertical, router]
  );

  const syncVertical = useCallback(
    (id: VerticalId) => {
      setVertical((prev) => {
        if (prev === id) return prev;
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-vertical", id);
        }
        fetch("/api/vertical", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vertical: id }),
        }).catch(() => {});
        return id;
      });
    },
    []
  );

  return (
    <VerticalContext.Provider
      value={{ vertical, config: VERTICALS[vertical], isSwitching: isPending, switchVertical, syncVertical }}
    >
      {children}
    </VerticalContext.Provider>
  );
}

export function useVertical() {
  const ctx = useContext(VerticalContext);
  if (!ctx) throw new Error("useVertical debe usarse dentro de VerticalProvider");
  return ctx;
}
