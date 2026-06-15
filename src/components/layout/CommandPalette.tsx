"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft } from "lucide-react";
import { VERTICALS, VERTICAL_IDS, SHARED_MODULES } from "@/lib/verticals";
import { useVertical } from "@/context/VerticalContext";
import { usePresentation } from "@/context/PresentationContext";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface Entry {
  label: string;
  sub: string;
  icon: string;
  path?: string;
  action?: () => void;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { switchVertical } = useVertical();
  const { toggle: togglePresentation } = usePresentation();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  const entries = useMemo<Entry[]>(() => {
    const list: Entry[] = [];
    for (const id of VERTICAL_IDS) {
      const v = VERTICALS[id];
      list.push({ label: `Ir a ${v.shortLabel}`, sub: v.label, icon: v.icon, path: `/${id}` });
      for (const m of v.modules) {
        list.push({ label: m.title, sub: `${v.shortLabel} · ${m.description}`, icon: m.icon, path: m.path });
      }
    }
    for (const m of SHARED_MODULES) {
      list.push({ label: m.title, sub: `Transversal · ${m.description}`, icon: m.icon, path: m.path });
    }
    list.push({
      label: "Modo presentación",
      sub: "Acción · rota módulos en pantalla completa",
      icon: "LayoutDashboard",
      action: togglePresentation,
    });
    return list;
  }, [togglePresentation]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return entries;
    return entries.filter((e) => (e.label + e.sub).toLowerCase().includes(t));
  }, [q, entries]);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
    }
  }, [open]);

  const go = (e: Entry) => {
    onClose();
    if (e.action) {
      e.action();
      return;
    }
    if (!e.path) return;
    const m = e.path.match(/^\/(cne|ae)/);
    if (m) switchVertical(m[1] as "cne" | "ae");
    router.push(e.path);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-strong neon-border w-full max-w-xl overflow-hidden rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <Search className="h-5 w-5 text-[var(--accent)]" />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, filtered.length - 1));
              if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
              if (e.key === "Enter" && filtered[active]) go(filtered[active]);
              if (e.key === "Escape") onClose();
            }}
            placeholder="Buscar módulo o vertical…"
            className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none"
          />
          <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-[var(--text-dim)]">esc</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-[var(--text-faint)]">Sin resultados</p>
          )}
          {filtered.map((e, i) => (
            <button
              key={(e.path ?? "action") + e.label}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(e)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                i === active ? "bg-white/8" : "hover:bg-white/5"
              )}
              style={i === active ? { background: "var(--accent-soft)" } : undefined}
            >
              <Icon name={e.icon} className="h-4.5 w-4.5" style={{ color: "var(--accent)" }} />
              <span className="flex-1 leading-tight">
                <span className="block text-sm font-semibold text-[var(--text)]">{e.label}</span>
                <span className="block text-[11px] text-[var(--text-dim)]">{e.sub}</span>
              </span>
              {i === active && <CornerDownLeft className="h-4 w-4 text-[var(--text-faint)]" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
