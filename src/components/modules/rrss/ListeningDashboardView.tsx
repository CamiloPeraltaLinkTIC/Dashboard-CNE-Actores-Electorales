"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { format } from "date-fns";
import { getDb } from "@/lib/supabase";
import { KPICard } from "./RrssKpiCard";
import { ListeningForm } from "./ListeningForm";
import { FileText, MessageCircle, Eye, Activity, Calendar, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useLayout } from "@/context/LayoutContext";
import { SentimentFigures } from "./EstrategiaDashboardView";
import { ImageFrame } from "@/components/ui/ImageFrame";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  PieChart, Pie, Cell,
  Tooltip, ResponsiveContainer,
} from "recharts";

const supabase = getDb("estrategia");

/* ── Emotion config (shared) ────────────────────────────────────────── */
const EMOTION_CFG = [
  { key: "Alegria",  label: "Alegría",  emoji: "😀", color: "#10b981", from: "#10b981", to: "#34d399" },
  { key: "Amor",     label: "Amor",     emoji: "😍", color: "#ec4899", from: "#ec4899", to: "#f472b6" },
  { key: "Sorpresa", label: "Sorpresa", emoji: "😮", color: "#f97316", from: "#f97316", to: "#fb923c" },
  { key: "Tristeza", label: "Tristeza", emoji: "😢", color: "#3b82f6", from: "#3b82f6", to: "#60a5fa" },
  { key: "Miedo",    label: "Miedo",    emoji: "😨", color: "#8b5cf6", from: "#8b5cf6", to: "#a78bfa" },
  { key: "Ira",      label: "Ira",      emoji: "😡", color: "#f43f5e", from: "#f43f5e", to: "#fb7185" },
];

/* ── 1. Funnel de Alcance ────────────────────────────────────────────── */
function ReachFunnelCard({
  alcance, interacciones, resultados,
}: { alcance: number; interacciones: number; resultados: number }) {
  const steps = [
    { label: "Alcance Potencial", value: alcance,       color: "#a78bfa", width: 100 },
    { label: "Interacciones",     value: interacciones,  color: "#22d3ee", width: 70  },
    { label: "Resultados",        value: resultados,     color: "#10b981", width: 44  },
  ];
  const convAI = alcance > 0 ? ((interacciones / alcance) * 100).toFixed(1) : "—";
  const convIR = interacciones > 0 ? ((resultados / interacciones) * 100).toFixed(1) : "—";

  return (
    <div className="glass p-6 flex flex-col min-h-[300px]">
      <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-1">Funnel de Alcance</h3>
      <p className="text-xs text-[var(--text-faint)] mb-6">Conversión de alcance a resultados</p>

      <div className="flex-1 flex flex-col items-center justify-center gap-1">
        {steps.map((step, i) => (
          <React.Fragment key={step.label}>
            <div className="w-full flex flex-col items-center gap-1.5" style={{ maxWidth: `${step.width}%` }}>
              <div
                className="w-full rounded-xl flex items-center justify-between px-4 py-3"
                style={{ background: `${step.color}18`, border: `1px solid ${step.color}35` }}
              >
                <span className="text-xs font-bold" style={{ color: step.color }}>{step.label}</span>
                <span className="text-lg font-black tabular-nums" style={{ color: step.color }}>
                  {step.value.toLocaleString("es-CO")}
                </span>
              </div>
            </div>

            {/* Flecha + tasa de conversión entre pasos */}
            {i < steps.length - 1 && (
              <div className="flex flex-col items-center gap-0.5 py-0.5">
                <span className="text-[10px] font-black text-[var(--text-dim)] tabular-nums">
                  {i === 0 ? `${convAI}%` : `${convIR}%`} conv.
                </span>
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                  <path d="M6 10L0 0h12L6 10z" fill="rgba(255,255,255,0.15)" />
                </svg>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/* ── 2. Radar de Emociones ───────────────────────────────────────────── */
function EmotionRadarCard({ cuota }: { cuota?: Record<string, { porcentaje: number }> }) {
  const radarData = EMOTION_CFG.map(({ key, label }) => ({
    emotion: label,
    value: Number(cuota?.[key]?.porcentaje ?? 0),
  }));

  const hasData = radarData.some(d => d.value > 0);

  return (
    <div className="glass p-6 flex flex-col min-h-[300px]">
      <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-1">Radar de Emociones</h3>
      <p className="text-xs text-[var(--text-faint)] mb-2">Perfil emocional de la conversación (%)</p>

      {!hasData ? (
        <div className="flex-1 flex items-center justify-center text-sm text-[var(--text-dim)] italic">Sin datos de emociones</div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid stroke="rgba(255,255,255,0.08)" />
            <PolarAngleAxis
              dataKey="emotion"
              tick={{ fill: "#8a93a8", fontSize: 11, fontWeight: 700 }}
            />
            <Radar
              dataKey="value"
              stroke="#e879f9"
              fill="#e879f9"
              fillOpacity={0.18}
              strokeWidth={2}
              dot={{ r: 4, fill: "#e879f9", strokeWidth: 0 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload;
                return (
                  <div className="rounded-xl px-3 py-2 text-xs font-bold text-[var(--text)]"
                    style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.15)" }}>
                    <p className="text-[var(--text-dim)] mb-1">{p.emotion}</p>
                    <p style={{ color: "#e879f9" }}>{p.value}%</p>
                  </div>
                );
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/* ── 3. Distribución de Impacto ──────────────────────────────────────── */
const IMPACT_COLORS: Record<string, string> = {
  positivo: "#10b981",
  negativo: "#f43f5e",
  neutral:  "#64748b",
};

function ImpactDistributionCard({
  cuentas, sitios,
}: {
  cuentas: { impacto: string }[];
  sitios:  { impacto: string }[];
}) {
  const all = [...(cuentas || []), ...(sitios || [])];
  const counts = all.reduce<Record<string, number>>((acc, item) => {
    const k = (item.impacto || "neutral").toLowerCase();
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  const pieData = [
    { name: "Positivo", value: counts["positivo"] || 0, color: IMPACT_COLORS.positivo },
    { name: "Negativo", value: counts["negativo"] || 0, color: IMPACT_COLORS.negativo },
    { name: "Neutral",  value: counts["neutral"]  || 0, color: IMPACT_COLORS.neutral  },
  ].filter(d => d.value > 0);

  const total = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="glass p-6 flex flex-col min-h-[300px]">
      <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-1">Distribución de Impacto</h3>
      <p className="text-xs text-[var(--text-faint)] mb-2">Cuentas y sitios por tipo de impacto</p>

      {total === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-[var(--text-dim)] italic">Sin datos de impacto</div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="relative w-44 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={70}
                  startAngle={90} endAngle={-270}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-xl px-3 py-2 text-xs font-bold"
                        style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.15)", color: d.color }}>
                        {d.name}: {d.value} ({Math.round((d.value / total) * 100)}%)
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-[var(--text)]">{total}</span>
              <span className="text-[10px] font-bold text-[var(--text-dim)]">fuentes</span>
            </div>
          </div>

          <div className="w-full space-y-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center justify-between rounded-lg px-3 py-2"
                style={{ background: `${d.color}12`, border: `1px solid ${d.color}30` }}>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-xs font-bold" style={{ color: d.color }}>{d.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-faint)]">{Math.round((d.value / total) * 100)}%</span>
                  <span className="text-sm font-black" style={{ color: d.color }}>{d.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ListeningMetrics {
  id: string;
  fecha: string;
  resultados: number;
  interacciones: number;
  alcance_potencial: number;
  sentimiento_positivo: number;
  sentimiento_negativo: number;
  activity_peak: string;
  hashtags: string;
  hashtags_para_usar: { text: string; importance: string }[];
  palabras_claves_para_usar: { text: string; importance: string }[];
  que_no_usar: { text: string; importance: string }[];
  cuentas_impacto: { nombre: string; identificador: string; impacto: string }[];
  sitios_impacto: { nombre: string; identificador: string; impacto: string }[];
  trend_resultados?: number;
  trend_interacciones?: number;
  trend_alcance_potencial?: number;
  cuota_emocion?: {
    [key: string]: { resultados: string; porcentaje: number; tendencia: string };
  };
}

/* ── Chips de importancia ───────────────────────────────────────────── */
const IMPORTANCE: Record<string, { chip: string }> = {
  alta:  { chip: "bg-orange-500/10 text-orange-300 border-orange-400/25"  },
  media: { chip: "bg-amber-500/10 text-amber-300 border-amber-400/25"     },
  baja:  { chip: "bg-white/6 text-[var(--text-dim)] border-white/12"      },
};

/* ── ListCard ─── chips/tags ──────────────────────────────────────────── */
export function ListCard({ title, items }: { title: string; items: { text: string; importance: string }[] }) {
  return (
    <div className="glass p-6 flex flex-col min-h-[260px]">
      <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4">{title}</h3>
      {!items || items.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-[var(--text-dim)] italic">No hay datos</div>
      ) : (
        <div className="flex flex-wrap gap-2 content-start">
          {items.map((item, idx) => {
            const style = IMPORTANCE[item.importance?.toLowerCase()] ?? IMPORTANCE.baja;
            return (
              <span
                key={idx}
                className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-semibold transition-all hover:scale-105 ${style.chip}`}
              >
                {item.text}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── ImpactCard ─────────────────────────────────────────────────────── */
const IMPACT_STYLE: Record<string, { badge: string; icon: string }> = {
  positivo: { badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: "↑" },
  negativo: { badge: "bg-rose-500/15 text-rose-400 border-rose-500/30",           icon: "↓" },
  neutral:  { badge: "bg-white/8 text-[var(--text-dim)] border-white/15",         icon: "–" },
};

export function ImpactCard({
  title, items, isUrl,
}: {
  title: string; items: { nombre: string; identificador: string; impacto: string }[]; isUrl?: boolean;
}) {
  return (
    <div className="glass p-6 flex flex-col min-h-[260px]">
      <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4">{title}</h3>
      <div className="flex-1 space-y-2.5 overflow-y-auto">
        {!items || items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-[var(--text-dim)] italic">No hay datos</div>
        ) : (
          items.map((item, idx) => {
            const key = item.impacto?.toLowerCase() in IMPACT_STYLE ? item.impacto.toLowerCase() : "neutral";
            const style = IMPACT_STYLE[key];
            return (
              <div key={idx} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 border border-white/8 px-4 py-3 hover:bg-white/8 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--text)] truncate">{item.nombre}</p>
                  {isUrl ? (
                    <a
                      href={item.identificador.startsWith("http") ? item.identificador : `https://${item.identificador}`}
                      target="_blank" rel="noreferrer"
                      className="text-xs text-[var(--accent)] hover:underline truncate block"
                    >
                      {item.identificador}
                    </a>
                  ) : (
                    <p className="text-xs text-[var(--text-dim)] truncate">{item.identificador}</p>
                  )}
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${style.badge}`}>
                  <span>{style.icon}</span>
                  {key === "positivo" ? "Positivo" : key === "negativo" ? "Negativo" : "Neutral"}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ── EmotionShareCard ─── barras con gradiente ─────────────────────── */

export function EmotionShareCard({ cuota }: { cuota?: ListeningMetrics["cuota_emocion"] }) {
  const hasData = cuota && Object.keys(cuota).length > 0;

  return (
    <div className="glass p-6 flex flex-col min-h-[300px]">
      <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-5">Cuota de Emoción</h3>

      {!hasData ? (
        <div className="flex-1 flex items-center justify-center text-sm text-[var(--text-dim)] italic">No hay datos de emociones</div>
      ) : (
        <div className="flex-1 space-y-3.5">
          {EMOTION_CFG.map(({ key, label, emoji, from, to }) => {
            const d = cuota![key] ?? { resultados: "0", porcentaje: 0, tendencia: "igual" };
            const pct = Number(d.porcentaje) || 0;
            const tend = d.tendencia;

            return (
              <div key={key} className="space-y-1.5">
                {/* Fila superior */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">{emoji}</span>
                    <span className="font-bold text-[var(--text)]">{label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {tend === "subio" && <ArrowUp className="w-3 h-3 text-emerald-400" />}
                    {tend === "bajo"  && <ArrowDown className="w-3 h-3 text-rose-400" />}
                    {tend !== "subio" && tend !== "bajo" && <Minus className="w-3 h-3 text-slate-400" />}
                    <span className="font-black tabular-nums" style={{ color: from }}>{pct}%</span>
                    <span className="text-[var(--text-faint)] ml-1">{Number(d.resultados).toLocaleString("es-CO")}</span>
                  </div>
                </div>
                {/* Barra */}
                <div className="h-2 w-full rounded-full bg-white/8 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.max(pct, pct > 0 ? 2 : 0)}%`,
                      background: `linear-gradient(90deg, ${from}, ${to})`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Vista principal ─────────────────────────────────────────────────── */
export function ListeningDashboardView({
  categoria, title, isMonthly = false,
}: {
  categoria: string; title: string; isMonthly?: boolean;
}) {
  const { userRole } = useLayout();
  const [data, setData]       = useState<ListeningMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const getTodayString = () =>
    isMonthly ? format(new Date(), "yyyy-MM-01") : format(new Date(), "yyyy-MM-dd");

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const { data: metrics, error } = await supabase
      .from("listening_metrics")
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

  const latest = filteredData.length > 0 ? filteredData[filteredData.length - 1] : null;

  return (
    <div className="space-y-8 pb-12">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text)]">{title}</h1>
          <p className="text-sm font-medium text-[var(--text-dim)] mt-1">Métricas de escucha social</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 glass px-3 py-2">
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
              className="text-sm border-none bg-transparent text-[var(--text)] focus:outline-none focus:ring-0 w-[120px]"
              title="Fecha del reporte"
            />
          </div>
          <ListeningForm
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
        <div className="h-[60vh] flex flex-col items-center justify-center glass gap-4">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
            <Activity className="w-8 h-8 text-[var(--text-dim)]" />
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
          {/* ── KPIs ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard title="Resultados"       value={latest?.resultados || 0}       icon={FileText}      colorClass="text-[var(--accent)]" trend={latest?.trend_resultados} />
            <KPICard title="Interacciones"    value={latest?.interacciones || 0}    icon={MessageCircle} colorClass="text-emerald-400"      trend={latest?.trend_interacciones} />
            <KPICard title="Alcance Potencial" value={latest?.alcance_potencial || 0} icon={Eye}          colorClass="text-purple-400"       trend={latest?.trend_alcance_potencial} />
          </div>

          {/* ── Gráficas: Funnel + Radar Emociones + Distribución Impacto ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ReachFunnelCard
              alcance={latest?.alcance_potencial || 0}
              interacciones={latest?.interacciones || 0}
              resultados={latest?.resultados || 0}
            />
            <EmotionRadarCard cuota={latest?.cuota_emocion} />
            <ImpactDistributionCard
              cuentas={latest?.cuentas_impacto || []}
              sitios={latest?.sitios_impacto || []}
            />
          </div>

          {/* ── Sentimiento + Emociones + Activity Peak ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SentimentFigures
              positive={latest?.sentimiento_positivo || 0}
              negative={latest?.sentimiento_negativo || 0}
              title="Sentimiento de la Conversación"
              columnReverse
            />
            <EmotionShareCard cuota={latest?.cuota_emocion} />
            <div className="glass p-6 flex flex-col min-h-[300px]">
              <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4">Activity Peak</h3>
              <div className="flex-1">
                <ImageFrame src={latest?.activity_peak} alt="Activity Peak" height="h-full min-h-[200px]" />
              </div>
            </div>
          </div>

          {/* ── Hashtags imagen ── */}
          <div className="glass p-6 min-h-[420px] flex flex-col">
            <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4">Hashtags</h3>
            <div className="flex-1">
              <ImageFrame src={latest?.hashtags} alt="Hashtags" height="h-full min-h-[340px]" />
            </div>
          </div>

          {/* ── Impacto ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImpactCard title="Cuentas con Mayor Impacto" items={latest?.cuentas_impacto || []} />
            <ImpactCard title="Sitios con Mayor Impacto"  items={latest?.sitios_impacto  || []} isUrl />
          </div>

          {/* ── Vocabulario ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ListCard title="Hashtags para usar"       items={latest?.hashtags_para_usar       || []} />
            <ListCard title="Palabras Claves para usar" items={latest?.palabras_claves_para_usar || []} />
            <ListCard title="Qué NO usar"              items={latest?.que_no_usar              || []} />
          </div>
        </>
      )}
    </div>
  );
}
