"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { format, subDays } from 'date-fns';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface ControlsProps {
  onFilterChange: (startDate: string, endDate: string) => void;
  isLoading: boolean;
}

function DashboardControlsInner({ onFilterChange, isLoading }: ControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    const urlStart = searchParams.get('startDate');
    const urlEnd = searchParams.get('endDate');

    let finalStart = urlStart;
    let finalEnd = urlEnd;

    if (!urlStart || !urlEnd) {
      const end = new Date();
      const start = subDays(end, 30);
      finalStart = format(start, 'yyyy-MM-dd');
      finalEnd = format(end, 'yyyy-MM-dd');
    }

    setStartDate(finalStart as string);
    setEndDate(finalEnd as string);

    // Disparar carga de datos
    onFilterChange(finalStart as string, finalEnd as string);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleApply = () => {
    if (startDate && endDate) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('startDate', startDate);
      params.set('endDate', endDate);
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  return (
    <div className="glass p-3 flex flex-wrap items-center justify-between gap-3 mb-6">
      {/* Grupo izquierdo: filtros de fecha */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-[var(--text-dim)] whitespace-nowrap">Desde:</label>
          <input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => setStartDate(e.target.value)}
            className="glass rounded-xl px-2 py-1.5 text-sm font-medium text-[var(--text)] placeholder:text-[var(--text-faint)] focus:neon-border focus:outline-none transition-all [color-scheme:dark]"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-[var(--text-dim)] whitespace-nowrap">Hasta:</label>
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            max={format(new Date(), 'yyyy-MM-dd')}
            onChange={(e) => setEndDate(e.target.value)}
            className="glass rounded-xl px-2 py-1.5 text-sm font-medium text-[var(--text)] placeholder:text-[var(--text-faint)] focus:neon-border focus:outline-none transition-all [color-scheme:dark]"
          />
        </div>

        <button
          onClick={handleApply}
          disabled={isLoading}
          className="px-4 py-2 accent-bg text-black text-sm font-bold rounded-xl transition-all hover:neon-glow disabled:opacity-50 flex items-center justify-center min-w-[100px] whitespace-nowrap"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            'Aplicar'
          )}
        </button>
      </div>
    </div>
  );
}

export function DashboardControls(props: ControlsProps) {
  return (
    <Suspense fallback={<div className="glass p-4 flex items-center justify-between h-[88px] mb-6 animate-pulse" />}>
      <DashboardControlsInner {...props} />
    </Suspense>
  );
}
