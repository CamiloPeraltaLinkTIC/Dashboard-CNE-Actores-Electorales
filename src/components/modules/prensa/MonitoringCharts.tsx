"use client";

import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const COLORS = {
  primary: "var(--accent)",
  secondary: "#FFA500",
  tertiary: "#ce1126",
  emerald: "#10b981",
  rose: "#f43f5e",
  blue: "#3b82f6",
  purple: "#8b5cf6",
  slate: "#8a93a8"
};

const tooltipStyle = {
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(11,17,32,0.95)",
  color: "var(--text)",
  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.5)"
};

const GRID_STROKE = "rgba(255,255,255,0.08)";
const AXIS_FILL = "#8a93a8";

export function MonitoringHistoricalChart({ data }: { data: any[] }) {
  const sortedData = [...data]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(-8); // Mostrar los últimos 8 días (hoy + 7 anteriores)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full h-full">
      {/* Chart 1: Menciones */}
      <div className="glass p-6 h-[350px] flex flex-col">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider">Historial de Menciones</h3>
          <p className="text-xs text-[var(--text-dim)] font-medium">Últimos 8 días</p>
        </div>
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sortedData}>
              <defs>
                <linearGradient id="colorMencionesDaily" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
              <XAxis
                dataKey="fecha"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: AXIS_FILL, fontWeight: "bold" }}
                tickFormatter={(val) => format(new Date(val + "T00:00:00"), "dd MMM", { locale: es })}
              />
              <YAxis hide={true} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(val) => format(new Date(val + "T00:00:00"), "dd MMMM yyyy", { locale: es })}
              />
              <Area
                type="monotone"
                dataKey="menciones_totales"
                name="Menciones"
                stroke={COLORS.primary}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorMencionesDaily)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Audiencia */}
      <div className="glass p-6 h-[350px] flex flex-col">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider">Historial de Audiencia</h3>
          <p className="text-xs text-[var(--text-dim)] font-medium">Últimos 8 días</p>
        </div>
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sortedData}>
              <defs>
                <linearGradient id="colorAudienciaDaily" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
              <XAxis
                dataKey="fecha"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: AXIS_FILL, fontWeight: "bold" }}
                tickFormatter={(val) => format(new Date(val + "T00:00:00"), "dd MMM", { locale: es })}
              />
              <YAxis hide={true} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(val) => format(new Date(val + "T00:00:00"), "dd MMMM yyyy", { locale: es })}
              />
              <Area
                type="monotone"
                dataKey="audiencia_estimada"
                name="Audiencia"
                stroke={COLORS.secondary}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorAudienciaDaily)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export function MonitoringMonthlyTrendChart({ data }: { data: any[] }) {
  const sortedData = [...data].sort((a, b) => a.fecha.localeCompare(b.fecha));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
      {/* Chart 1: Menciones */}
      <div className="glass p-6 h-[350px] flex flex-col">
        <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4">Tendencia de Menciones</h3>
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sortedData}>
              <defs>
                <linearGradient id="colorMencionesMonthly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
              <XAxis
                dataKey="fecha"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: AXIS_FILL }}
                tickFormatter={(val) => format(new Date(val + "T00:00:00"), "dd", { locale: es })}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: AXIS_FILL }}
                tickFormatter={(val) => val.toLocaleString()}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(val) => format(new Date(val + "T00:00:00"), "dd MMMM yyyy", { locale: es })}
              />
              <Area
                type="monotone"
                dataKey="menciones_totales"
                name="Menciones"
                stroke={COLORS.primary}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorMencionesMonthly)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Audiencia */}
      <div className="glass p-6 h-[350px] flex flex-col">
        <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4">Tendencia de Audiencia</h3>
        <div className="flex-1 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sortedData}>
              <defs>
                <linearGradient id="colorAudienciaMonthly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
              <XAxis
                dataKey="fecha"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: AXIS_FILL }}
                tickFormatter={(val) => format(new Date(val + "T00:00:00"), "dd", { locale: es })}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: AXIS_FILL }}
                tickFormatter={(val) => val.toLocaleString()}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(val) => format(new Date(val + "T00:00:00"), "dd MMMM yyyy", { locale: es })}
              />
              <Area
                type="monotone"
                dataKey="audiencia_estimada"
                name="Audiencia"
                stroke={COLORS.secondary}
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorAudienciaMonthly)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export function SentimentFigures({ positive, negative }: { positive: number, negative: number }) {
  const neutral = Math.max(0, 100 - positive - negative);

  return (
    <div className="glass p-6 h-full lg:h-[350px] flex flex-col">
      <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4 text-center">Análisis de Sentimiento</h3>
      <div className="flex-1 flex items-center justify-center py-4">
        <div className="flex flex-wrap items-center justify-center gap-y-6 w-full max-w-md px-2">
          <div className="flex flex-col items-center text-center min-w-[80px] flex-1">
            <span className="text-3xl md:text-4xl font-black text-emerald-400">{positive}%</span>
            <span className="text-[10px] md:text-xs font-bold text-[var(--text-dim)] uppercase mt-1 tracking-wider">Positivo</span>
          </div>

          <div className="hidden sm:block w-px h-12 bg-white/10 mx-2"></div>

          <div className="flex flex-col items-center text-center min-w-[80px] flex-1">
            <span className="text-3xl md:text-4xl font-black text-[var(--text-dim)]">{neutral}%</span>
            <span className="text-[10px] md:text-xs font-bold text-[var(--text-dim)] uppercase mt-1 tracking-wider">Neutral</span>
          </div>

          <div className="hidden sm:block w-px h-12 bg-white/10 mx-2"></div>

          <div className="flex flex-col items-center text-center min-w-[80px] flex-1">
            <span className="text-3xl md:text-4xl font-black text-rose-400">{negative}%</span>
            <span className="text-[10px] md:text-xs font-bold text-[var(--text-dim)] uppercase mt-1 tracking-wider">Negativo</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CoverageChart({ tv, digital, radio, impresos = 0 }: { tv: number, digital: number, radio: number, impresos?: number }) {
  const data = [
    { name: "TV", value: tv, color: "#22d3ee" },
    { name: "Digital", value: digital, color: COLORS.blue },
    { name: "Radio", value: radio, color: COLORS.purple },
    { name: "Impresos", value: impresos, color: COLORS.secondary }
  ].filter(d => d.value > 0);

  return (
    <div className="glass p-6 h-[350px] flex flex-col">
      <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4 text-center">Cobertura por Tipo de Medio</h3>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ percent = 0 }) => `${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(11,17,32,0.6)" />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TierChart({ tier1, tier2, tier3 }: { tier1: number, tier2: number, tier3: number }) {
  const data = [
    { name: "Tier 1", value: tier1, color: "#22d3ee" },
    { name: "Tier 2", value: tier2, color: COLORS.emerald },
    { name: "Tier 3", value: tier3, color: COLORS.secondary }
  ].filter(d => d.value > 0);

  return (
    <div className="glass p-6 h-[350px] flex flex-col">
      <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4 text-center">Distribución por Tier</h3>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ percent = 0 }) => `${(percent * 100).toFixed(1)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(11,17,32,0.6)" />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span className="text-[10px] font-bold text-[var(--text-dim)] uppercase">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
