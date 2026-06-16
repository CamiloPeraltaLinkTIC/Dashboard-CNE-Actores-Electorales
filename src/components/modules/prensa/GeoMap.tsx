"use client";

import React, { useMemo, useState, useEffect } from "react";
import Map from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { ScatterplotLayer as SimpleScatterplotLayer } from "@deck.gl/layers";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface GeoMapProps {
  data: { lat: number; lng: number; weight: number; city: string }[];
  height?: string;
}

const defaultViewState = {
  longitude: -74.0817,
  latitude: 4.6097,
  zoom: 4,
  pitch: 0,
  bearing: 0,
};

/**
 * Distribución geográfica de menciones.
 * Combina el mapa de calor visual (deck.gl + maplibre) con el ranking de calor
 * por ubicación (diagrama de barras), ambos alimentados por el mismo prop `data`.
 */
export function GeoMap({ data, height = "h-[1100px]" }: GeoMapProps) {
  const points = useMemo(
    () => (data || []).filter((d) => (d.weight || 0) > 0),
    [data]
  );

  const maxWeight = useMemo(() => {
    if (points.length === 0) return 1;
    return Math.max(...points.map((d) => d.weight));
  }, [points]);

  const ranked = useMemo(
    () => [...points].sort((a, b) => b.weight - a.weight),
    [points]
  );

  const [isSmartTV, setIsSmartTV] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent;
      const isTV = /SmartTV|Tizen|WebOS|Android TV|Large Screen|TV/i.test(ua);
      setIsSmartTV(isTV);
    }
  }, []);

  const initialViewState = useMemo(() => {
    if (points.length > 0) {
      const top = points.reduce((prev, curr) =>
        prev.weight > curr.weight ? prev : curr
      );
      return { ...defaultViewState, longitude: top.lng, latitude: top.lat };
    }
    return defaultViewState;
  }, [points]);

  const layers = useMemo(() => {
    if (points.length === 0) return [];

    if (isSmartTV) {
      // Fallback para Smart TVs (ScatterplotLayer es más ligero y compatible).
      return [
        new SimpleScatterplotLayer({
          id: "tv-scatter-layer",
          data: points,
          getPosition: (d: any) => [d.lng, d.lat],
          getFillColor: (d: any) => {
            const ratio = d.weight / maxWeight;
            if (ratio > 0.8) return [153, 27, 27, 200];
            if (ratio > 0.5) return [239, 68, 68, 180];
            if (ratio > 0.2) return [250, 204, 21, 150];
            return [253, 224, 71, 120];
          },
          getRadius: (d: any) => 30000 + (d.weight / maxWeight) * 50000,
          pickable: true,
        }),
      ];
    }

    return [
      new HeatmapLayer({
        id: "heatmap-layer",
        data: points,
        getPosition: (d: any) => [d.lng, d.lat],
        getWeight: (d: any) => d.weight,
        intensity: 8,
        radiusPixels: 65,
        threshold: 0.05,
        colorRange: [
          [253, 224, 71],
          [250, 204, 21],
          [249, 115, 22],
          [239, 68, 68],
          [220, 38, 38],
          [153, 27, 27],
        ],
        aggregation: "SUM",
      }),
    ];
  }, [points, isSmartTV, maxWeight]);

  return (
    <div
      className={cn(
        "glass p-6 w-full flex flex-col relative overflow-hidden",
        height
      )}
    >
      <div className="mb-4 z-10">
        <h2 className="text-lg font-black text-[var(--text)]">
          Mapa de Tráfico de Calor
        </h2>
        <p className="text-sm text-[var(--text-dim)] font-medium">
          Concentración geográfica de menciones
        </p>
      </div>

      {/* Mapa de calor visual */}
      <div className="relative z-10 h-[55%] min-h-0 rounded-xl overflow-hidden border border-white/10 bg-[#070b16]">
        {points.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[var(--text-dim)]">
            <MapPin className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-bold text-sm">No hay ubicaciones registradas</p>
          </div>
        ) : (
          <DeckGL
            initialViewState={initialViewState}
            controller={true}
            layers={layers}
            useDevicePixels={false}
            getTooltip={({ object }) =>
              object &&
              (object.city
                ? `${object.city}: ${object.weight.toLocaleString("es-CO")} menciones`
                : `${object.weight.toLocaleString("es-CO")} menciones`)
            }
          >
            <Map
              mapStyle={{
                version: 8,
                sources: {
                  "esri-dark": {
                    type: "raster",
                    tiles: [
                      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
                    ],
                    tileSize: 256,
                    attribution:
                      "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
                  },
                },
                layers: [
                  {
                    id: "esri-dark-bg",
                    type: "background",
                    paint: { "background-color": "#070b16" },
                  },
                  {
                    id: "esri-dark-layer",
                    type: "raster",
                    source: "esri-dark",
                    minzoom: 0,
                    maxzoom: 19,
                  },
                ],
              }}
              attributionControl={false}
            />
          </DeckGL>
        )}
      </div>

      {/* Ranking de calor por ubicación (diagrama de barras) */}
      <div className="mt-4 mb-2 z-10">
        <h3 className="text-sm font-black text-[var(--text)]">
          Ranking por ubicación
        </h3>
      </div>
      <div className="flex-1 w-full min-h-0 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-4">
        {ranked.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[var(--text-dim)]">
            <MapPin className="w-10 h-10 mb-3 opacity-20" />
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
                    <span className="text-[var(--text-dim)]">
                      {loc.weight.toLocaleString("es-CO")}
                    </span>
                  </div>
                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(ratio * 100, 4)}%`,
                        background: "var(--accent)",
                        boxShadow: "0 0 16px -4px var(--accent)",
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
