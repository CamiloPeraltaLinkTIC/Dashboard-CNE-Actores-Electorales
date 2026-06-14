"use client";

import React from "react";
import { TrendingUp, Users, Bot } from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

interface HistoryChartProps {
  data: any[];
}

export function HistoryChart({ data }: HistoryChartProps) {
  const chartData = [...data].reverse();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Active Users Chart */}
      <section className="glass p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
              <Users className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <h3 className="text-xl font-black text-[var(--text)]">Usuarios Activos</h3>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-dim)] bg-white/5 px-4 py-2 rounded-full">
            <TrendingUp className="w-4 h-4" />
            Últimos 30 días
          </div>
        </div>

        <div className="h-[300px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{fill: '#8a93a8', fontSize: 10, fontWeight: 600}}
                  tickFormatter={(str) => {
                    const date = new Date(str + "T00:00:00");
                    return date.getDate().toString();
                  }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{fill: '#8a93a8', fontSize: 12, fontWeight: 600}}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '1.5rem',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: 'rgba(17, 22, 33, 0.95)',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
                    padding: '1.5rem',
                    color: '#ffffff'
                  }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Area
                  type="monotone"
                  dataKey="usuarios_activos"
                  stroke="var(--accent)"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorUsers)"
                  name="Usuarios Activos"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-[var(--text-dim)] font-medium italic">
              No hay datos suficientes
            </div>
          )}
        </div>
      </section>

      {/* Resolutions Chart */}
      <section className="glass p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
              <Bot className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-xl font-black text-[var(--text)]">Resoluciones Custos</h3>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-dim)] bg-white/5 px-4 py-2 rounded-full">
            <TrendingUp className="w-4 h-4" />
            Últimos 30 días
          </div>
        </div>

        <div className="h-[300px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorResolutions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{fill: '#8a93a8', fontSize: 10, fontWeight: 600}}
                  tickFormatter={(str) => {
                    const date = new Date(str + "T00:00:00");
                    return date.getDate().toString();
                  }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{fill: '#8a93a8', fontSize: 12, fontWeight: 600}}
                  tickFormatter={(val) => `${val}%`}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '1.5rem',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: 'rgba(17, 22, 33, 0.95)',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
                    padding: '1.5rem',
                    color: '#ffffff'
                  }}
                  itemStyle={{ color: '#ffffff' }}
                  formatter={(value: any) => [`${value}%`, "Resoluciones Custos"]}
                />
                <Area
                  type="monotone"
                  dataKey="resoluciones_automatizadas"
                  stroke="#34d399"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorResolutions)"
                  name="Resoluciones Custos"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-[var(--text-dim)] font-medium italic">
              No hay datos suficientes
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
