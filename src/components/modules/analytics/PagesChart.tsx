"use client";

import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface PagesChartProps {
  data: any[];
}

const LEGENDS = [
  { key: "views", label: "Vistas", color: "var(--accent)" },
  { key: "users", label: "Usuarios", color: "#fcd116" },
];

export function PagesChart({ data }: PagesChartProps) {
  return (
    <div className="glass p-6 w-full flex flex-col relative overflow-hidden group transition-all hover:neon-glow">
      <div className="flex items-start justify-between mb-4 z-10">
        <div>
          <h2 className="text-lg font-black text-[var(--text)]">Top Páginas Visitadas</h2>
          <p className="text-sm text-[var(--text-dim)] font-medium">Vistas y usuarios activos</p>
        </div>
        {/* Leyenda personalizada fuera del SVG — siempre visible arriba */}
        <div className="flex flex-wrap justify-end gap-x-3 gap-y-1.5 ml-2">
          {LEGENDS.map((l) => (
            <div key={l.key} className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-dim)]">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>

      <div className="h-[300px] w-full z-10 -ml-2">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.08)" />
              <XAxis type="number" tick={{ fill: '#8a93a8', fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="displayName"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#8a93a8', fontSize: 11, fontWeight: 600 }}
                width={160}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                contentStyle={{
                  backgroundColor: 'rgba(11, 17, 32, 0.95)',
                  borderColor: 'rgba(255,255,255,0.12)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
                  color: '#e8edf7',
                  fontWeight: 600
                }}
                itemStyle={{ color: '#e8edf7', fontWeight: 700 }}
              />
              <Bar dataKey="views" name="Vistas" fill="var(--accent)" radius={[0, 4, 4, 0]} barSize={12} />
              <Bar dataKey="users" name="Usuarios" fill="#fcd116" radius={[0, 4, 4, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--text-faint)] font-medium">Cargando páginas...</div>
        )}
      </div>
    </div>
  );
}
