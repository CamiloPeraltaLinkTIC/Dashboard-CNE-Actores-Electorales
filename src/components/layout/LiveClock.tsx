"use client";

import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";

/** Reloj en vivo de la Topbar (sensación de panel operativo). */
export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null; // evita desajuste de hidratación (se monta en cliente)

  const time = now.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const date = now.toLocaleDateString("es-CO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  return (
    <div className="glass hidden items-center gap-2 rounded-xl px-3 py-2 lg:flex">
      <Clock className="h-3.5 w-3.5" style={{ color: "var(--accent)" }} />
      <span className="font-mono text-sm font-bold tracking-tight text-[var(--text)]">{time}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-faint)]">
        {date}
      </span>
    </div>
  );
}
