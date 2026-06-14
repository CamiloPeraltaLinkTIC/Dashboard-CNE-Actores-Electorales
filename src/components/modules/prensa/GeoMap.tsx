"use client";

import React, { useMemo } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface GeoMapProps {
  data: { lat: number; lng: number; weight: number; city: string }[];
  height?: string;
}

/**
 * Distribución geográfica de menciones.
 * Nota: la app unificada no incluye deck.gl / maplibre, por lo que el mapa de calor
 * original se representa aquí como un ranking de calor por ubicación (mismo prop `data`).
 */
export function GeoMap({ data, height = "h-[400px]" }: GeoMapProps) {
  const ranked = useMemo(() => {
    if (!data || data.length === 0) return [];
    return [...data]
      .filter((d) => (d.weight || 0) > 0)
      .sort((a, b) => b.weight - a.weight);
  }, [data]);

  const maxWeight = useMemo(() => {
    if (ranked.length === 0) return 1;
    return Math.max(...ranked.map((d) => d.weight));
  }, [ranked]);

  return (
    <div className={cn("glass p-6 w-full flex flex-col relative overflow-hidden", height)}>
      <div className="mb-4 z-10">
        <h2 className="text-lg font-black text-[var(--text)]">Mapa de Tráfico de Calor</h2>
        <p className="text-sm text-[var(--text-dim)] font-medium">Concentración geográfica de menciones</p>
      </div>

      <div className="flex-1 w-full min-h-0 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-4">
        {ranked.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[var(--text-dim)]">
            <MapPin className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-bold text-sm">No hay ubicaciones registradas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ranked.map((loc, idx) => {
              const ratio = loc.weight / maxWeight;
              return (
                <div key={`${loc.city}-${idx}`} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-[var(--text)]">
                      <MapPin className="w-3.5 h-3.5 text-[var(--accent)]" />
                      {loc.city || `${loc.lat.toFixed(2)}, ${loc.lng.toFixed(2)}`}
                    </span>
                    <span className="text-[var(--text-dim)]">{loc.weight.toLocaleString("es-CO")}</span>
                  </div>
                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(ratio * 100, 4)}%`,
                        background: "var(--accent)",
                        boxShadow: "0 0 16px -4px var(--accent)"
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
