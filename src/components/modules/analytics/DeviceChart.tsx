"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface DeviceChartProps {
  data: any[];
}

export function DeviceChart({ data }: DeviceChartProps) {
  return (
    <div className="glass p-6 w-full flex flex-col relative overflow-hidden group transition-all hover:neon-glow">
      <div className="mb-4 z-10 text-center">
        <h2 className="text-lg font-black text-[var(--text)]">Sesiones por Dispositivo</h2>
        <p className="text-sm text-[var(--text-dim)] font-medium">Distribución actual</p>
      </div>

      <div className="h-[260px] w-full z-10">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(11, 17, 32, 0.95)',
                  borderColor: 'rgba(255,255,255,0.12)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                  color: '#e8edf7',
                  fontWeight: 600
                }}
                itemStyle={{ color: '#e8edf7', fontWeight: 700 }}
              />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={6}
                dataKey="value"
                nameKey="name"
                stroke="none"
                cornerRadius={6}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill || '#003893'}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--text-faint)] font-medium">Cargando datos...</div>
        )}
      </div>

      {/* Leyenda personalizada fuera del SVG — crece hacia abajo libremente */}
      {data.length > 0 && (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 z-10">
          {data.map((entry, index) => (
            <div key={index} className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-dim)]">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.fill || '#003893' }}
              />
              {entry.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
