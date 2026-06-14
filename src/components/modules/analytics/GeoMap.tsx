"use client";

import React, { useMemo } from "react";
import Map from 'react-map-gl/maplibre';
import DeckGL from '@deck.gl/react';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
// Import ScatterplotLayer specifically if it's not in aggregation-layers
import { ScatterplotLayer as SimpleScatterplotLayer } from '@deck.gl/layers';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useState, useEffect } from "react";

interface GeoMapProps {
  data: { lat: number; lng: number; weight: number; city: string }[];
  height?: string;
}

const defaultViewState = {
  longitude: -74.0817,
  latitude: 4.6097,
  zoom: 4,
  pitch: 0,
  bearing: 0
};

export function GeoMap({ data, height = "h-[400px]" }: GeoMapProps) {
  const maxWeight = useMemo(() => {
    if (!data || data.length === 0) return 1;
    return Math.max(...data.map(d => d.weight));
  }, [data]);

  const [isSmartTV, setIsSmartTV] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent;
      const isTV = /SmartTV|Tizen|WebOS|Android TV|Large Screen|TV/i.test(ua);
      setIsSmartTV(isTV);
    }
  }, []);

  const initialViewState = useMemo(() => {
    if (data && data.length > 0) {

      const topLocation = data.reduce((prev, current) => (prev.weight > current.weight) ? prev : current);
      return { ...defaultViewState, longitude: topLocation.lng, latitude: topLocation.lat };
    }
    return defaultViewState;
  }, [data]);

  const layers = useMemo(() => {
    if (!data || data.length === 0) return [];

    if (isSmartTV) {
      // Fallback para Smart TVs usando ScatterplotLayer (mucho más ligero y compatible)
      return [
        new SimpleScatterplotLayer({
          id: 'tv-scatter-layer',
          data,
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
        })
      ];
    }

    return [
      new HeatmapLayer({
        id: 'heatmap-layer',
        data,
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
          [153, 27, 27]
        ],
        aggregation: 'SUM',
      })
    ];
  }, [data, isSmartTV, maxWeight]);

  return (
    <div className={`glass p-6 w-full flex flex-col relative overflow-hidden group transition-all hover:neon-glow ${height}`}>
      <div className="mb-4 z-10">
        <h2 className="text-lg font-black text-[var(--text)]">Mapa de Tráfico de Calor</h2>
        <p className="text-sm text-[var(--text-dim)] font-medium">Concentración geográfica de usuarios activos</p>
      </div>

      <div className="flex-1 w-full min-h-0 relative z-10 rounded-xl overflow-hidden border border-white/10 bg-[#070b16]">
        <DeckGL
          initialViewState={initialViewState}
          controller={true}
          layers={layers}
          useDevicePixels={false}
          getTooltip={({ object }) => object && (object.city ? `${object.city}: ${object.weight} usuarios` : `${object.weight} usuarios`)}
        >
          <Map
            mapStyle={{
              version: 8,
              sources: {
                'esri-dark': {
                  type: 'raster',
                  tiles: [
                    'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
                  ],
                  tileSize: 256,
                  attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
                }
              },
              layers: [
                {
                  id: 'esri-dark-bg',
                  type: 'background',
                  paint: { 'background-color': '#070b16' }
                },
                {
                  id: 'esri-dark-layer',
                  type: 'raster',
                  source: 'esri-dark',
                  minzoom: 0,
                  maxzoom: 19
                }
              ]
            }}
            attributionControl={false}
          />
        </DeckGL>
      </div>
    </div>
  );
}
