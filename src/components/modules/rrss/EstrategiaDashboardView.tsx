"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { format } from "date-fns";
import { getDb } from "@/lib/supabase";
import { KPICard } from "./RrssKpiCard";
import { EstrategiaForm } from "./EstrategiaForm";
import { Users, UserPlus, FileText, Send, Eye, Heart, MessageCircle, Activity } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import { useLayout } from "@/context/LayoutContext";
import { Calendar } from "lucide-react";
import { ImageFrame } from "@/components/ui/ImageFrame";

const supabase = getDb("estrategia");

interface MetricsData {
  id: string;
  fecha: string;
  seguidores: number;
  nuevos_seguidores: number;
  num_publicaciones: number;
  contenidos_entregados: number;
  impresiones: number;
  reacciones_likes: number;
  comentarios_respuestas: number;
  social_performance_score: number;
  contenidos_publicados: number;
  publicaciones_principales: string;
  sentimiento_positivo: number;
  sentimiento_neutro: number;
  sentimiento_negativo: number;
}

function extractNumber(val: any): number {
  if (val === undefined || val === null || val === "") return 0;
  const normalized = String(val).replace(",", ".").replace(/[^0-9.-]+/g, "");
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

/* ── Donut de sentimiento ─────────────────────────────────────────────── */
export function SentimentFigures({
  positive, negative, title, columnReverse,
}: {
  positive: any; negative: any; title?: string; columnReverse?: boolean;
}) {
  const posNum = extractNumber(positive);
  const negNum = extractNumber(negative);
  const neutNum = Number(Math.max(0, 100 - posNum - negNum).toFixed(1));

  const segments = [
    { name: "Positivo", value: posNum,  color: "#10b981", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
    { name: "Neutral",  value: neutNum, color: "#64748b", bg: "bg-slate-500/10",   text: "text-slate-400",   border: "border-slate-500/20"  },
    { name: "Negativo", value: negNum,  color: "#f43f5e", bg: "bg-rose-500/10",    text: "text-rose-400",    border: "border-rose-500/20"   },
  ];

  const dominant = segments.reduce((a, b) => (a.value >= b.value ? a : b));
  const domEmoji = dominant.name === "Positivo" ? "😊" : dominant.name === "Negativo" ? "😟" : "😐";

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const s = segments.find(x => x.name === payload[0].name);
    return (
      <div className="glass-strong rounded-xl px-3 py-2 text-xs font-bold" style={{ color: s?.color }}>
        {payload[0].name}: {payload[0].value.toFixed(1)}%
      </div>
    );
  };

  return (
    <div className="glass p-6 flex flex-col h-full">
      <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-5">
        {title ?? "Análisis de Sentimiento"}
      </h3>

      <div className={`flex gap-6 flex-1 ${columnReverse ? "flex-col-reverse" : "items-center"}`}>
        {/* Donut */}
        <div className={`relative shrink-0 ${columnReverse ? "w-full h-44" : "w-44 h-44"}`}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={segments}
                cx="50%" cy="50%"
                innerRadius={52} outerRadius={70}
                startAngle={90} endAngle={-270}
                dataKey="value"
                strokeWidth={0}
              >
                {segments.map((s, i) => (
                  <Cell key={i} fill={s.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Centro */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl">{domEmoji}</span>
            <span className="text-[10px] font-bold text-[var(--text-dim)] mt-0.5">{dominant.name}</span>
          </div>
        </div>

        {/* Cards */}
        <div className="flex-1 space-y-2.5">
          {segments.map(s => (
            <div
              key={s.name}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 ${s.bg} ${s.border}`}
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                <span className={`text-xs font-bold uppercase tracking-wider ${s.text}`}>{s.name}</span>
              </div>
              <span className={`text-xl font-black tabular-nums ${s.text}`}>
                {s.value.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Tooltip personalizado para el área chart ─────────────────────────── */
function AreaTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-4 py-3 text-xs space-y-1.5 min-w-[160px]">
      <p className="font-bold text-[var(--text-dim)] mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.color }} className="font-semibold">{p.name}</span>
          <span className="font-black text-[var(--text)]">{Number(p.value).toLocaleString("es-CO")}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Vista principal ─────────────────────────────────────────────────── */
export function EstrategiaDashboardView({
  categoria, title, isMonthly = false,
}: {
  categoria: string; title: string; isMonthly?: boolean;
}) {
  const { userRole } = useLayout();
  const [data, setData] = useState<MetricsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const getTodayString = () =>
    isMonthly ? format(new Date(), "yyyy-MM-01") : format(new Date(), "yyyy-MM-dd");

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const { data: metrics, error } = await supabase
      .from("estrategia_digital_metrics")
      .select("*")
      .eq("categoria", categoria)
      .order("fecha", { ascending: true });

    if (!error) setData(metrics || []);
    setIsLoading(false);
  }, [categoria]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredData = React.useMemo(
    () => (!selectedDate ? data : data.filter(d => d.fecha <= selectedDate)),
    [data, selectedDate]
  );

  const latest   = filteredData.length > 0 ? filteredData[filteredData.length - 1] : null;
  const previous = filteredData.length > 1 ? filteredData[filteredData.length - 2] : null;

  const trend = (cur: number, prev: number) =>
    !prev || prev === 0 ? 0 : Number((((cur - prev) / prev) * 100).toFixed(1));

  /* histórico para el chart */
  const chartData = filteredData.map(d => ({
    fecha: d.fecha.substring(5),
    Seguidores:  d.seguidores,
    Impresiones: d.impresiones,
    Reacciones:  d.reacciones_likes,
  }));

  /* radar — normaliza cada métrica respecto al máximo del dataset */
  const radarMetrics = [
    { key: "seguidores",           label: "Seguidores"    },
    { key: "nuevos_seguidores",    label: "Nuevos Seg."   },
    { key: "impresiones",          label: "Impresiones"   },
    { key: "reacciones_likes",     label: "Reacciones"    },
    { key: "comentarios_respuestas", label: "Comentarios" },
  ] as const;

  const radarData = radarMetrics.map(({ key, label }) => {
    const maxVal = Math.max(...filteredData.map(d => extractNumber((d as any)[key])), 1);
    const val    = extractNumber((latest as any)?.[key] ?? 0);
    return { metric: label, value: Math.round((val / maxVal) * 100), raw: val };
  });

  return (
    <div className="space-y-8 pb-12">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text)]">{title}</h1>
          <p className="text-sm font-medium text-[var(--text-dim)] mt-1">Métricas y rendimiento digital</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="glass flex items-center gap-2 px-3 py-2">
            <Calendar
              className="w-4 h-4 text-[var(--text-dim)] cursor-pointer hover:text-[var(--accent)] transition-colors"
              onClick={() => dateInputRef.current?.showPicker()}
            />
            <input
              ref={dateInputRef}
              type={isMonthly ? "month" : "date"}
              value={isMonthly ? selectedDate.substring(0, 7) : selectedDate}
              max={isMonthly ? format(new Date(), "yyyy-MM") : getTodayString()}
              onChange={e => {
                const val = e.target.value;
                setSelectedDate(isMonthly ? `${val}-01` : val);
              }}
              className="text-sm border-none bg-transparent text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-0 w-[120px]"
              title="Fecha del reporte"
            />
          </div>
          <EstrategiaForm
            categoria={categoria}
            onSuccess={fetchData}
            initialData={latest}
            selectedDate={selectedDate}
            isMonthly={isMonthly}
          />
        </div>
      </div>

      {/* ── States ── */}
      {isLoading ? (
        <div className="h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]" />
        </div>
      ) : data.length === 0 ? (
        <div className="glass h-[60vh] flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
            <Users className="w-8 h-8 text-[var(--text-dim)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text)]">Aún no hay datos para {title}</h2>
          <p className="text-[var(--text-dim)] text-sm max-w-md text-center">
            {userRole === "viewer"
              ? "No se han registrado métricas. Contacta al administrador."
              : 'Ingresa los primeros datos usando el botón "Ingresar Datos".'}
          </p>
        </div>
      ) : (
        <>
          {/* ── KPIs fila 1 ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <KPICard
              title="Social Performance Score"
              value={latest?.social_performance_score || 0}
              icon={Activity}
              valueSuffix={<span className="text-base text-[var(--text-dim)] font-bold">/1000</span>}
              colorClass="text-[var(--accent)]"
            />
            <KPICard title="Seguidores Totales"   value={latest?.seguidores || 0}        icon={Users}         trend={trend(latest?.seguidores || 0, previous?.seguidores || 0)} />
            <KPICard title="Nuevos Seguidores"    value={latest?.nuevos_seguidores || 0} icon={UserPlus}      colorClass="text-[#fcd116]" trend={trend(latest?.nuevos_seguidores || 0, previous?.nuevos_seguidores || 0)} />
            <KPICard title="Impresiones"          value={latest?.impresiones || 0}       icon={Eye}           colorClass="text-emerald-400" trend={trend(latest?.impresiones || 0, previous?.impresiones || 0)} />
            <KPICard title="Reacciones y Likes"   value={latest?.reacciones_likes || 0}  icon={Heart}         colorClass="text-rose-400"    trend={trend(latest?.reacciones_likes || 0, previous?.reacciones_likes || 0)} />
          </div>

          {/* ── KPIs fila 2 ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard title="Comentarios"          value={latest?.comentarios_respuestas || 0} icon={MessageCircle} colorClass="text-orange-400" />
            <KPICard title="Publicaciones"        value={latest?.num_publicaciones || 0}      icon={FileText}      colorClass="text-blue-400"   />
            <KPICard title="Contenidos Entregados" value={latest?.contenidos_entregados || 0} icon={Send}          colorClass="text-purple-400" />
            <KPICard title="Contenidos Publicados" value={latest?.contenidos_publicados || 0} icon={FileText}      colorClass="text-teal-400"   />
          </div>

          {/* ── Radar + Producción de Contenido ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Radar de Engagement */}
            <div className="glass p-6 flex flex-col">
              <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-1">Perfil de Engagement</h3>
              <p className="text-xs text-[var(--text-faint)] mb-4">Cada eje muestra el % respecto al valor máximo registrado</p>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fill: "#8a93a8", fontSize: 11, fontWeight: 700 }}
                  />
                  <Radar
                    name="Engagement"
                    dataKey="value"
                    stroke="var(--accent)"
                    fill="var(--accent)"
                    fillOpacity={0.18}
                    strokeWidth={2}
                    dot={{ r: 4, fill: "var(--accent)", strokeWidth: 0 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p = payload[0].payload;
                      return (
                        <div className="rounded-xl px-3 py-2 text-xs font-bold text-[var(--text)]" style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.15)" }}>
                          <p className="text-[var(--text-dim)] mb-1">{p.metric}</p>
                          <p style={{ color: "var(--accent)" }}>{p.value}% <span className="text-[var(--text-faint)] font-medium">({Number(p.raw).toLocaleString("es-CO")})</span></p>
                        </div>
                      );
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Producción de Contenido */}
            <div className="glass p-6 flex flex-col">
              <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-1">Producción de Contenido</h3>
              <p className="text-xs text-[var(--text-faint)] mb-6">Flujo de contenidos del evento</p>
              <div className="flex-1 flex flex-col justify-center space-y-5">
                {[
                  { label: "Contenidos Entregados", value: latest?.contenidos_entregados || 0, color: "#22d3ee", ref: Math.max(latest?.contenidos_entregados || 0, latest?.contenidos_publicados || 0, latest?.num_publicaciones || 0, 1) },
                  { label: "Contenidos Publicados", value: latest?.contenidos_publicados || 0, color: "#10b981", ref: Math.max(latest?.contenidos_entregados || 0, latest?.contenidos_publicados || 0, latest?.num_publicaciones || 0, 1) },
                  { label: "Publicaciones",         value: latest?.num_publicaciones || 0,     color: "#a78bfa", ref: Math.max(latest?.contenidos_entregados || 0, latest?.contenidos_publicados || 0, latest?.num_publicaciones || 0, 1) },
                ].map(({ label, value, color, ref }) => {
                  const pct = Math.round((value / ref) * 100);
                  return (
                    <div key={label} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-[var(--text)]">{label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--text-faint)]">{pct}%</span>
                          <span className="text-lg font-black tabular-nums" style={{ color }}>{value.toLocaleString("es-CO")}</span>
                        </div>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-white/8 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.max(pct, value > 0 ? 2 : 0)}%`, background: color }}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Tasa de publicación */}
                {(latest?.contenidos_entregados || 0) > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/8 flex items-center justify-between">
                    <span className="text-xs text-[var(--text-dim)] font-semibold uppercase tracking-wide">Tasa de Publicación</span>
                    <span className="text-2xl font-black" style={{ color: "#10b981" }}>
                      {Math.round(((latest?.contenidos_publicados || 0) / (latest?.contenidos_entregados || 1)) * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Chart histórico ── */}
          {chartData.length > 1 && (
            <div className="glass p-6">
              <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-5">Tendencia Histórica</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gSeg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22d3ee" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gImp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gRea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="fecha" stroke="#5b647a" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#5b647a" tick={{ fontSize: 11 }} width={48} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip content={<AreaTooltip />} />
                  <Area type="monotone" dataKey="Seguidores"  name="Seguidores"  stroke="#22d3ee" strokeWidth={2} fill="url(#gSeg)" dot={false} />
                  <Area type="monotone" dataKey="Impresiones" name="Impresiones" stroke="#10b981" strokeWidth={2} fill="url(#gImp)" dot={false} />
                  <Area type="monotone" dataKey="Reacciones"  name="Reacciones"  stroke="#f43f5e" strokeWidth={2} fill="url(#gRea)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              {/* Leyenda */}
              <div className="flex flex-wrap gap-4 mt-4 justify-center">
                {[["Seguidores","#22d3ee"],["Impresiones","#10b981"],["Reacciones","#f43f5e"]].map(([l,c]) => (
                  <div key={l} className="flex items-center gap-1.5 text-xs text-[var(--text-dim)] font-medium">
                    <span className="h-2.5 w-5 rounded-full" style={{ background: c }} />
                    {l}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Sentimiento + Publicaciones principales ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SentimentFigures
              positive={latest?.sentimiento_positivo || 0}
              negative={latest?.sentimiento_negativo || 0}
              title="Análisis de Sentimiento General"
            />

            <div className="glass p-6 flex flex-col" style={{ minHeight: 320 }}>
              <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4">
                Publicaciones Principales
              </h3>
              <div className="flex-1">
                <ImageFrame
                  src={latest?.publicaciones_principales}
                  alt="Publicaciones Principales"
                  height="h-full min-h-[220px]"
                  emptyText="No hay captura disponible para esta fecha"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
