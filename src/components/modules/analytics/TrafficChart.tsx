"use client";

import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface TrafficChartProps {
  data: any[];
}

export function TrafficChart({ data }: TrafficChartProps) {
  return (
    <div className="glass p-6 h-[400px] w-full flex flex-col relative overflow-hidden group transition-all hover:neon-glow">
      <div className="flex items-center justify-between mb-6 z-10">
        <div>
          <h2 className="text-lg font-black text-[var(--text)]">Resumen de Tráfico</h2>
          <p className="text-sm text-[var(--text-dim)] font-medium">Usuarios y sesiones en el rango activo</p>
        </div>
        <div className="flex space-x-4 text-xs font-bold">
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-[var(--accent)] mr-2"></span>
            <span className="text-[var(--text-dim)]">Usuarios</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-[#fcd116] mr-2"></span>
            <span className="text-[var(--text-dim)]">Sesiones</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 z-10 -ml-2">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fcd116" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#fcd116" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#8a93a8', fontSize: 12, fontWeight: 500 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#8a93a8', fontSize: 12, fontWeight: 500 }}
                tickFormatter={(v) => Number(v).toLocaleString("es-CO")}
                dx={-10}
              />
              <Tooltip
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
                formatter={(value: any) => Number(value).toLocaleString("es-CO")}
              />
              <Area
                type="monotone"
                dataKey="sessions"
                name="Sesiones"
                stroke="#fcd116"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorSessions)"
                activeDot={{ r: 6, strokeWidth: 0, fill: '#fcd116' }}
              />
              <Area
                type="monotone"
                dataKey="users"
                name="Usuarios"
                stroke="var(--accent)"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorUsers)"
                activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--accent)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--text-faint)] font-medium">Cargando datos...</div>
        )}
      </div>
    </div>
  );
}
