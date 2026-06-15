"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ToastContextType {
  toast: (t: { kind?: ToastKind; title: string; description?: string }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ICONS: Record<ToastKind, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-300" />,
  error: <AlertTriangle className="h-5 w-5 text-rose-300" />,
  info: <Info className="h-5 w-5" style={{ color: "var(--accent)" }} />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastContextType["toast"]>(
    ({ kind = "info", title, description }) => {
      const id = ++seq.current;
      setToasts((prev) => [...prev, { id, kind, title, description }]);
      setTimeout(() => remove(id), 3800);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[200] flex w-[min(92vw,360px)] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="glass-strong neon-border pointer-events-auto flex items-start gap-3 rounded-2xl p-3.5 shadow-2xl"
            >
              <span className="mt-0.5 flex-shrink-0">{ICONS[t.kind]}</span>
              <div className="flex-1 leading-tight">
                <p className="text-sm font-bold text-[var(--text)]">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-xs text-[var(--text-dim)]">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => remove(t.id)}
                className="text-[var(--text-faint)] transition-colors hover:text-[var(--text)]"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}
