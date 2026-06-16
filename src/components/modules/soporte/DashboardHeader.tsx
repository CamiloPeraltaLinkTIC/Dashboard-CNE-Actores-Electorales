"use client";

import React, { useRef } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  History
} from "lucide-react";

interface DashboardHeaderProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onShowForm?: () => void;
  onShowHistory: () => void;
  hasDataForSelectedDate: boolean;
  isAdmin: boolean;
}

export function DashboardHeader({ selectedDate, onDateChange, onShowForm, onShowHistory, hasDataForSelectedDate, isAdmin }: DashboardHeaderProps) {
  const dateRef = useRef<HTMLInputElement>(null);
  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-[var(--text)]">
          Mesa de Ayuda <span className="text-[var(--accent)]">—</span> Custos
        </h1>
        <div className="h-1 w-20 accent-bg rounded-full my-1" />
        <p className="text-[var(--text-dim)] font-medium text-sm">Dashboard de gestión operativa y resoluciones</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="glass flex items-center gap-2 px-3 py-2">
          <CalendarIcon
            className="w-4 h-4 text-[var(--text-dim)] cursor-pointer hover:text-[var(--accent)] transition-colors"
            onClick={() => dateRef.current?.showPicker()}
          />
          <input
            ref={dateRef}
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="text-sm border-none bg-transparent text-[var(--text)] placeholder:text-[var(--text-faint)] focus:neon-border focus:outline-none focus:ring-0 font-bold [color-scheme:dark]"
          />
        </div>

        {isAdmin && (
          <button
            onClick={onShowForm}
            className="flex items-center gap-2 accent-bg text-black px-5 py-2.5 rounded-xl font-bold hover:neon-glow transition-all"
          >
            <Plus className="w-4 h-4" />
            {hasDataForSelectedDate ? 'Editar Datos' : 'Ingresar Datos'}
          </button>
        )}
        <button
          onClick={onShowHistory}
          className="flex items-center gap-2 glass text-[var(--text-dim)] hover:text-[var(--text)] px-5 py-2.5 rounded-xl font-bold transition-all"
        >
          <History className="w-4 h-4" />
          Historial
        </button>
      </div>
    </header>
  );
}
