"use client";

import React, { useState, useMemo } from "react";
import { Target, TrendingUp, Users, Activity, MousePointerClick } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { KPICard } from "@/components/modules/analytics/KPICard";
import { TrafficChart } from "@/components/modules/analytics/TrafficChart";
import { DeviceChart } from "@/components/modules/analytics/DeviceChart";
import { PagesChart } from "@/components/modules/analytics/PagesChart";
import { GeoMap } from "@/components/modules/analytics/GeoMap";
import { DashboardControls } from "@/components/modules/analytics/DashboardControls";
import { DbStatus } from "@/components/ui/DbStatus";
import { TabBar } from "@/components/ui/TabBar";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

/* ======================================================================
   Tooltip oscuro reutilizable para recharts
   ====================================================================== */
const darkTooltip = {
  contentStyle: {
    backgroundColor: "rgba(11, 17, 32, 0.95)",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: "12px",
    backdropFilter: "blur(10px)",
    boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
    color: "#e8edf7",
    fontWeight: 600,
  },
  itemStyle: { color: "#e8edf7", fontWeight: 700 },
};

const PIE_COLORS = ['#e879f9', '#22d3ee', '#fcd116', '#f472b6', '#818cf8', '#34d399', '#fb923c', '#f87171', '#a78bfa', '#2dd4bf'];

function ErrorBox({ message }: { message: string }) {
  // Detecta el fallo típico de red/DNS hacia la API de Google Analytics.
  const isNetwork = /ENOTFOUND|UNAVAILABLE|getaddrinfo|Name resolution|ECONNREFUSED|ETIMEDOUT|fetch failed|network/i.test(
    message || ""
  );

  if (isNetwork) {
    return (
      <div className="glass mt-6 w-full border border-amber-500/30 p-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
            <Activity className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-[var(--text)]">
              Datos de Google Analytics no disponibles
            </h3>
            <p className="mt-1 text-sm text-[var(--text-dim)]">
              El servidor no pudo conectarse a{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-amber-300">
                analyticsdata.googleapis.com
              </code>
              . Es un problema de red/DNS o de firewall del entorno, no del dashboard:
              esta máquina no resuelve el host de la API de Google (Supabase sí funciona).
            </p>
            <ul className="mt-2 list-disc pl-5 text-xs text-[var(--text-faint)]">
              <li>Verifica la conexión a internet y el DNS del servidor.</li>
              <li>Si hay proxy corporativo, define <code className="text-amber-300">HTTPS_PROXY</code> para Node.</li>
              <li>Asegura que el firewall permita salida a <code className="text-amber-300">*.googleapis.com</code>.</li>
              <li>La pestaña <strong>Indicadores</strong> (datos de Supabase) funciona sin GA4.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass mt-6 w-full border border-rose-500/30 p-6 text-center text-rose-300">
      <h3 className="mb-2 text-lg font-bold">Error de conexión con GA4</h3>
      <p className="text-sm">{message}</p>
    </div>
  );
}

function Spinner({ accent = "var(--accent)" }: { accent?: string }) {
  return (
    <div
      className="w-8 h-8 border-4 border-white/10 rounded-full animate-spin"
      style={{ borderTopColor: accent }}
    />
  );
}

/* ======================================================================
   Tarjetas auxiliares (Pie / List) compartidas por sub-secciones
   ====================================================================== */
function PieCard({ title, subtitle, data }: { title: string; subtitle: string; data: any[] }) {
  if (!data || data.length === 0) return <CardLoading title={title} subtitle={subtitle} />;
  return (
    <div className="glass p-6 w-full transition-all hover:neon-glow">
      <div className="mb-4 text-center">
        <h2 className="text-lg font-black text-[var(--text)]">{title}</h2>
        <p className="text-sm text-[var(--text-dim)] font-medium">{subtitle}</p>
      </div>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip {...darkTooltip} />
            <Pie data={data} cx="50%" cy="50%" outerRadius="80%" innerRadius="55%" paddingAngle={2} dataKey="users" nameKey="name" stroke="none" cornerRadius={6}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
        {data.map((entry, index) => (
          <div key={index} className="flex items-center gap-1.5 text-sm font-semibold text-[var(--text-dim)]">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
            {entry.name}
          </div>
        ))}
      </div>
    </div>
  );
}

function ListCard({ title, subtitle, data }: { title: string; subtitle: string; data: any[] }) {
  if (!data || data.length === 0) return <CardLoading title={title} subtitle={subtitle} />;
  const maxUsers = Math.max(...data.map((d) => d.users));
  return (
    <div className="glass p-6 w-full transition-all hover:neon-glow flex flex-col h-[400px]">
      <div className="mb-4 text-left">
        <h2 className="text-lg font-black text-[var(--text)]">{title}</h2>
        <p className="text-sm text-[var(--text-dim)] font-medium">{subtitle}</p>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {data.map((item, idx) => {
          const width = Math.max((item.users / maxUsers) * 100, 2);
          return (
            <div key={idx} className="relative w-full rounded-lg overflow-hidden bg-white/5 border border-white/10 flex items-center justify-between p-3">
              <div className="absolute left-0 top-0 bottom-0 bg-[var(--accent-soft)] z-0 rounded-r-lg" style={{ width: `${width}%` }} />
              <span className="relative z-10 text-sm font-bold text-[var(--text)] truncate max-w-[75%]">{item.name}</span>
              <span className="relative z-10 text-sm font-black text-[var(--accent)] bg-white/5 px-2 py-1 rounded-md border border-white/10">{item.users}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CardLoading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="glass p-6 w-full h-[400px] flex flex-col justify-center items-center opacity-70">
      <div className="mb-4"><Spinner /></div>
      <p className="text-sm font-bold text-[var(--text-dim)]">Cargando datos de {title}...</p>
      <span className="sr-only">{subtitle}</span>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
      <div>
        <h1 className="text-2xl font-black text-[var(--text)]">{title}</h1>
        <p className="text-[var(--text-dim)] font-medium text-sm">{subtitle}</p>
      </div>
    </div>
  );
}

/* ======================================================================
   OVERVIEW (app/page.tsx original)
   ====================================================================== */
function OverviewView() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>({
    kpis: {
      totalUsers: { value: "0", change: "-", trend: "neutral", prevText: "" },
      activeUsers: { value: "0", change: "-", trend: "neutral", prevText: "" },
      newUsers: { value: "0", change: "-", trend: "neutral", prevText: "" },
      views: { value: "0", change: "-", trend: "neutral", prevText: "" },
      sessions: { value: "0", change: "-", trend: "neutral", prevText: "" },
      bounceRate: { value: "0%", change: "-", trend: "neutral", prevText: "" },
    },
    traffic: [], devices: [], pages: [], geo: [],
  });

  const fetchData = async (startDate: string, endDate: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/analytics?startDate=${startDate}&endDate=${endDate}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.details || json.error || 'Error obteniendo datos');
      if (json.kpis && !json.kpis.totalUsers) { /* skip cached */ }
      else setData(json);
    } catch (err: any) {
      console.error(err); setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div>
      <SectionHeader title="Visión General" subtitle="Datos directos de Google Analytics 4." />
      <DashboardControls onFilterChange={fetchData} isLoading={loading} />
      {error ? <ErrorBox message={error} /> : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
            <div className="glass p-4 md:p-6">
              <h2 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4 px-2">Audiencia</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KPICard id="totalUsers" title="Usuarios Totales" value={data.kpis.totalUsers?.value || "0"} change={data.kpis.totalUsers?.change || "-"} trend={data.kpis.totalUsers?.trend || "neutral"} prevText={data.kpis.totalUsers?.prevText} />
                <KPICard id="activeUsers" title="Usuarios Activos" value={data.kpis.activeUsers?.value || "0"} change={data.kpis.activeUsers?.change || "-"} trend={data.kpis.activeUsers?.trend || "neutral"} prevText={data.kpis.activeUsers?.prevText} />
                <KPICard id="newUsers" title="Nuevos Usuarios" value={data.kpis.newUsers?.value || "0"} change={data.kpis.newUsers?.change || "-"} trend={data.kpis.newUsers?.trend || "neutral"} prevText={data.kpis.newUsers?.prevText} />
              </div>
            </div>
            <div className="glass p-4 md:p-6">
              <h2 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4 px-2">Interacción</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KPICard id="views" title="Vistas de Página" value={data.kpis.views?.value || "0"} change={data.kpis.views?.change || "-"} trend={data.kpis.views?.trend || "neutral"} prevText={data.kpis.views?.prevText} />
                <KPICard id="sessions" title="Sesiones" value={data.kpis.sessions?.value || "0"} change={data.kpis.sessions?.change || "-"} trend={data.kpis.sessions?.trend || "neutral"} prevText={data.kpis.sessions?.prevText} />
                <KPICard id="bounce" title="Tasa de Rebote" value={data.kpis.bounceRate?.value || "0%"} change={data.kpis.bounceRate?.change || "-"} trend={data.kpis.bounceRate?.trend || "neutral"} prevText={data.kpis.bounceRate?.prevText} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-6">
            <div className="lg:col-span-2"><TrafficChart data={data.traffic} /></div>
            <div className="lg:col-span-1"><DeviceChart data={data.devices} /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-6">
            <PagesChart data={data.pages} />
            <GeoMap data={data.geo} />
          </div>
        </>
      )}
    </div>
  );
}

/* ======================================================================
   INDICADORES (manual_metrics vía /api/analytics/manual + GA4 indicators)
   ====================================================================== */
function IndicatorCard({ title, value, target, progress, icon: Icon, color, isGood, subtitle }: any) {
  return (
    <div className="glass p-6 w-full transition-all hover:neon-glow flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className={cn("p-3 rounded-2xl", color)}>
            <Icon className="w-6 h-6 text-black" />
          </div>
          <div className={cn("px-3 py-1 rounded-full text-xs font-bold", isGood ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-400")}>
            {isGood ? "En objetivo" : "Requiere atención"}
          </div>
        </div>
        <h2 className="text-[var(--text-dim)] font-semibold text-sm mb-1">{title}</h2>
        <div className="flex items-center mb-2">
          {typeof value === "string" || typeof value === "number" ? (
            <span className="text-3xl font-black text-[var(--text)]">{value}</span>
          ) : value}
        </div>
        <p className="text-xs text-[var(--text-faint)] font-medium mb-6">{subtitle} - Objetivo: {target}</p>
      </div>
      <div>
        <div className="flex justify-between text-xs font-bold text-[var(--text-dim)] mb-2">
          <span>Progreso</span>
          <span>{Math.min(100, Math.max(0, progress)).toFixed(2)}%</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
          <div className={cn("h-2.5 rounded-full transition-all duration-1000", isGood ? "bg-emerald-400" : "bg-rose-400")} style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </div>
      </div>
    </div>
  );
}

function IndicatorsView() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  // Manual metrics (tabla manual_metrics vía /api/analytics/manual)
  const [scrollDepth, setScrollDepth] = useState<string>("");
  const [weeklyGrowth, setWeeklyGrowth] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/analytics/manual");
        const m = await res.json();
        if (m.scroll_depth) setScrollDepth(m.scroll_depth);
        if (m.weekly_growth) setWeeklyGrowth(m.weekly_growth);
      } catch { /* ignore */ }
    })();
  }, []);

  const saveMetric = (key: string, value: string) => {
    fetch("/api/analytics/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    }).catch(() => {});
  };

  const onScroll = (v: string) => { setScrollDepth(v); saveMetric("scroll_depth", v); };
  const onGrowth = (v: string) => { setWeeklyGrowth(v); saveMetric("weekly_growth", v); };

  const fetchData = async (startDate: string, endDate: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/analytics/indicators?startDate=${startDate}&endDate=${endDate}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.details || json.error || 'Error obteniendo datos');
      setData(json);
    } catch (err: any) {
      console.error(err); setError(err.message);
    } finally { setLoading(false); }
  };

  const inputCls = "w-36 text-3xl font-black text-[var(--text)] glass rounded-xl px-3 py-1 focus:neon-border focus:outline-none transition-all text-center [color-scheme:dark]";

  // KPIs de ingreso manual (tabla manual_metrics — Supabase). Funcionan sin GA4.
  const manualCards = (
    <>
      <IndicatorCard title="Crecimiento Semanal" value={<div className="flex items-center"><input type="number" value={weeklyGrowth} onChange={(e) => onGrowth(e.target.value)} className={inputCls} /><span className="text-3xl font-black text-[var(--text)] ml-2">%</span></div>} target="> 15%" subtitle="Ingreso manual del crecimiento" progress={((Number(weeklyGrowth) || 0) / 15) * 100} icon={TrendingUp} color="bg-emerald-400" isGood={(Number(weeklyGrowth) || 0) > 15} />
      <IndicatorCard title="% de Desplazamiento" value={<div className="flex items-center"><input type="number" min="0" max="100" value={scrollDepth} onChange={(e) => onScroll(e.target.value)} className={inputCls} /><span className="text-3xl font-black text-[var(--text)] ml-2">%</span></div>} target="> 65%" subtitle="Ingreso manual del porcentaje" progress={((Number(scrollDepth) || 0) / 65) * 100} icon={MousePointerClick} color="bg-fuchsia-400" isGood={(Number(scrollDepth) || 0) >= 65} />
    </>
  );

  return (
    <div>
      <SectionHeader title="Indicadores Clave (KPIs)" subtitle="Seguimiento de objetivos estratégicos" />
      <DashboardControls onFilterChange={fetchData} isLoading={loading} />
      {error && <ErrorBox message={error} />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {data && !error && (
          <>
            <IndicatorCard title="Usuarios Nuevos" value={data.newUsers.toLocaleString("es-CO")} target="400.000" subtitle="Adquisición total del periodo" progress={(data.newUsers / 400000) * 100} icon={Users} color="accent-bg" isGood={data.newUsers >= 400000} />
            <IndicatorCard title="Tasa de Rebote" value={`${data.bounceRate.toFixed(2)}%`} target="< 40%" subtitle="Porcentaje de sesiones sin interacción" progress={data.bounceRate <= 40 ? 100 : (40 / data.bounceRate) * 100} icon={Activity} color="bg-rose-500" isGood={data.bounceRate < 40} />
            <IndicatorCard title="Interacción Efectiva" value={`${data.effectiveInteraction.toFixed(2)}%`} target="> 60%" subtitle="Usuarios activos sobre usuarios totales" progress={(data.effectiveInteraction / 60) * 100} icon={Target} color="bg-amber-400" isGood={data.effectiveInteraction > 60} />
          </>
        )}
        {/* Los KPIs manuales (Supabase) se muestran siempre, incluso si GA4 falla. */}
        {manualCards}
      </div>
    </div>
  );
}

/* ======================================================================
   ADQUISICIÓN
   ====================================================================== */
function AcquisitionView() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>({ sessionChannel: [], sessionSource: [], sessionMedium: [], sessionCampaign: [] });

  const fetchData = async (startDate: string, endDate: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/analytics/acquisition?startDate=${startDate}&endDate=${endDate}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.details || json.error || 'Error obteniendo datos');
      setData(json);
    } catch (err: any) { console.error(err); setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <SectionHeader title="Adquisición de usuarios" subtitle="Fuentes, canales de adquisición y orígenes de tráfico" />
      <DashboardControls onFilterChange={fetchData} isLoading={loading} />
      {error ? <ErrorBox message={error} /> : (
        <div className="space-y-6 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <PieCard title="Canal de Adquisición" subtitle="Grupo de canales predeterminado" data={data.sessionChannel} />
            <PieCard title="Medio de la Sesión" subtitle="El medio de donde provienen (cpc, organic, email)" data={data.sessionMedium} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ListCard title="Fuente de la Sesión" subtitle="El origen específico (google, direct, facebook)" data={data.sessionSource} />
            <ListCard title="Campañas" subtitle="Nombre de las campañas de marketing" data={data.sessionCampaign} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ======================================================================
   AUDIENCIA (demográfico + GeoMap)
   ====================================================================== */
function AudienceView() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>({ country: [], city: [], region: [], language: [], geoOptions: [] });

  const fetchData = async (startDate: string, endDate: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/analytics/audience?startDate=${startDate}&endDate=${endDate}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.details || json.error || 'Error obteniendo datos');
      setData(json);
    } catch (err: any) { console.error(err); setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <SectionHeader title="Análisis Demográfico" subtitle="Distribución geográfica, regiones y dialectos de tus usuarios." />
      <DashboardControls onFilterChange={fetchData} isLoading={loading} />
      {error ? <ErrorBox message={error} /> : (
        <div className="space-y-6 mt-6">
          <div className="w-full"><GeoMap data={data.geoOptions} height="h-[600px] md:h-[700px]" /></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ListCard title="Países" subtitle="Concentración demográfica a nivel nacional" data={data.country} />
            <ListCard title="Ciudades" subtitle="Tráfico filtrado a nivel de metrópolis locales" data={data.city} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ListCard title="Estados / Departamentos" subtitle="Segmentación por regiones administrativas" data={data.region} />
            <ListCard title="Idiomas Configurados" subtitle="Lenguaje nativo del navegador del usuario" data={data.language} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ======================================================================
   COMPORTAMIENTO (radar de eventos + tabla de páginas)
   ====================================================================== */
function BehaviorView() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>({ events: [], pages: [], metrics: { totalEvents: 0, scrollCount: 0 } });

  const fetchData = async (startDate: string, endDate: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/analytics/behavior?startDate=${startDate}&endDate=${endDate}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.details || json.error || 'Error obteniendo datos');
      const maxEventCount = Math.max(...(json.events.map((e: any) => e.A) || [100]));
      const formattedEvents = json.events.map((e: any) => ({ ...e, fullMark: maxEventCount }));
      setData({ ...json, events: formattedEvents });
    } catch (err: any) { console.error(err); setError(err.message); }
    finally { setLoading(false); }
  };

  const scrollPercentage = data.metrics.totalEvents > 0
    ? ((data.metrics.scrollCount / data.metrics.totalEvents) * 100).toFixed(2)
    : 0;

  return (
    <div>
      <SectionHeader title="Comportamiento" subtitle="Páginas más visitadas, eventos y análisis de scroll." />
      <DashboardControls onFilterChange={fetchData} isLoading={loading} />
      {error ? <ErrorBox message={error} /> : (
        <div className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-dim)] font-bold uppercase tracking-wider mb-1">Total de Eventos Registrados</p>
                <h3 className="text-3xl font-black text-[var(--text)]">{data.metrics.totalEvents.toLocaleString()}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent)] font-black text-xl">⚡</div>
            </div>
            <div className="glass p-6 flex items-center justify-between relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-sm text-[var(--text-dim)] font-bold uppercase tracking-wider mb-1">Scroll Down (Interacción Profunda)</p>
                <h3 className="text-3xl font-black text-rose-400">
                  {data.metrics.scrollCount.toLocaleString()}
                  <span className="text-lg font-bold text-[var(--text-faint)] ml-2">({scrollPercentage}% del total)</span>
                </h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 font-black text-xl relative z-10">↓</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass p-6 w-full transition-all hover:neon-glow">
              <h2 className="text-lg font-black text-[var(--text)] mb-1">Interacciones (Eventos)</h2>
              <p className="text-sm text-[var(--text-dim)] font-medium mb-4">Volumen relativo de eventos capturados</p>
              <div className="h-[350px] w-full">
                {data.events.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.events}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#8a93a8', fontSize: 12, fontWeight: 600 }} />
                      <PolarRadiusAxis angle={30} tick={false} axisLine={false} />
                      <Tooltip {...darkTooltip} />
                      <Radar name="Eventos" dataKey="A" stroke="var(--accent)" strokeWidth={3} fill="var(--accent)" fillOpacity={0.4} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex flex-col justify-center items-center opacity-70">
                    <div className="mb-4"><Spinner /></div>
                    <p className="text-sm font-bold text-[var(--text-dim)]">Cargando eventos...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="glass p-6 w-full transition-all hover:neon-glow flex flex-col h-[450px]">
              <h2 className="text-lg font-black text-[var(--text)] mb-1">Rutas de Página más Frecuentes</h2>
              <p className="text-sm text-[var(--text-dim)] font-medium mb-4">Páginas con más visualizaciones</p>
              <div className="flex-1 overflow-auto">
                {data.pages.length > 0 ? (
                  <table className="w-full text-sm text-left text-[var(--text-dim)]">
                    <thead className="text-xs text-[var(--text-dim)] uppercase bg-white/5 border-b border-white/10 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Página</th>
                        <th className="px-4 py-3">Vistas</th>
                        <th className="px-4 py-3">T. Medio</th>
                        <th className="px-4 py-3 rounded-tr-lg">Métrica de Rebote</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.pages.map((page: any, idx: number) => (
                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-[var(--accent)] truncate max-w-[150px]" title={page.path}>{page.path}</div>
                            <div className="text-xs text-[var(--text-faint)] truncate max-w-[150px]" title={page.title}>{page.title}</div>
                          </td>
                          <td className="px-4 py-3 font-black text-[var(--text)]">{page.views.toLocaleString()}</td>
                          <td className="px-4 py-3 font-medium text-[var(--text-dim)]">{page.avgTime}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-rose-500/10 text-rose-400 font-bold rounded-full text-xs">{page.bounce}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="w-full h-full flex flex-col justify-center items-center opacity-70">
                    <div className="mb-4"><Spinner /></div>
                    <p className="text-sm font-bold text-[var(--text-dim)]">Cargando páginas...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ======================================================================
   CONVERSIONES
   ====================================================================== */
function ConversionsView() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ timeline: any[]; events: any[] }>({ timeline: [], events: [] });

  const fetchData = async (startDate: string, endDate: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/analytics/conversions?startDate=${startDate}&endDate=${endDate}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.details || json.error || 'Error obteniendo datos');
      setData(json);
    } catch (err: any) { console.error(err); setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <SectionHeader title="Conversiones" subtitle="Metas alcanzadas y eventos clave (Key Events)." />
      <DashboardControls onFilterChange={fetchData} isLoading={loading} />
      {error ? <ErrorBox message={error} /> : (
        <div className="grid grid-cols-1 gap-6 mt-6">
          <div className="glass p-6 w-full transition-all hover:neon-glow">
            <h2 className="text-lg font-black text-[var(--text)] mb-1">Tasa de Conversión a lo largo del tiempo</h2>
            <p className="text-sm text-[var(--text-dim)] font-medium mb-6">Porcentaje de sesiones que resultaron en una meta</p>
            <div className="h-[350px] w-full min-h-[350px] -ml-4">
              {loading && data.timeline.length === 0 ? (
                <div className="w-full h-full flex flex-col justify-center items-center opacity-70">
                  <div className="mb-4"><Spinner accent="#f87171" /></div>
                  <p className="text-sm font-bold text-[var(--text-dim)]">Cargando métricas de conversión...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#8a93a8', fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8a93a8', fontWeight: 600 }} tickFormatter={(val) => `${val}%`} />
                    <Tooltip formatter={(value) => [`${value}%`, "Tasa de Conversión"]} {...darkTooltip} />
                    <Area type="monotone" dataKey="rate" stroke="#f87171" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="glass p-6 w-full transition-all hover:neon-glow">
            <h2 className="text-lg font-black text-[var(--text)] mb-1">Eventos Clave (Conversiones)</h2>
            <p className="text-sm text-[var(--text-dim)] font-medium mb-6">Total de conversiones por tipo de evento</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {loading && data.events.length === 0 ? (
                <div className="col-span-full py-12 flex justify-center items-center opacity-70"><Spinner /></div>
              ) : data.events.length === 0 ? (
                <div className="col-span-full bg-white/5 p-6 rounded-2xl border-2 border-dashed border-white/10 text-center flex flex-col items-center justify-center min-h-[200px]">
                  <Target className="w-10 h-10 text-amber-300 mb-3" />
                  <h3 className="text-xl font-bold text-[var(--text)]">Sin conversiones</h3>
                  <p className="text-[var(--text-dim)] text-sm mt-2 max-w-[250px]">No se encontraron eventos marcados como conversiones en este periodo.</p>
                </div>
              ) : (
                data.events.map((evt, idx) => (
                  <div key={idx} className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center group hover:bg-[var(--accent-soft)] transition-colors">
                    <Target className="w-8 h-8 text-[var(--accent)] mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="text-lg font-bold text-[var(--text)] break-all">{evt.name}</h3>
                    <p className="text-2xl font-black text-rose-400 mt-2">{evt.conversions}</p>
                    <span className="text-xs font-bold text-[var(--text-faint)] uppercase tracking-wider mt-1">Total</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ======================================================================
   TECNOLOGÍA
   ====================================================================== */
function TechnologyView() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>({ deviceCategory: [], mobileDeviceModel: [], operatingSystem: [], screenResolution: [], browser: [] });

  const fetchData = async (startDate: string, endDate: string) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/analytics/technology?startDate=${startDate}&endDate=${endDate}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.details || json.error || 'Error obteniendo datos');
      setData(json);
    } catch (err: any) { console.error(err); setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <SectionHeader title="Infraestructura Tecnológica" subtitle="Dispositivos, navegadores, sistemas y orígenes de tráfico." />
      <DashboardControls onFilterChange={fetchData} isLoading={loading} />
      {error ? <ErrorBox message={error} /> : (
        <div className="space-y-6 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            <PieCard title="Dispositivos" subtitle="Categorización Principal" data={data.deviceCategory} />
            <PieCard title="Sistemas Operativos" subtitle="Software nativo utilizado" data={data.operatingSystem} />
            <PieCard title="Navegadores" subtitle="Programas web de acceso" data={data.browser} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ListCard title="Modelos de Dispositivo" subtitle="Auditoría específica de hardware móvil" data={data.mobileDeviceModel} />
            <ListCard title="Resolución de Pantalla" subtitle="Dimensiones de monitores para diseño UI" data={data.screenResolution} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ======================================================================
   CONTENEDOR CON PESTAÑAS
   ====================================================================== */
interface Tab { key: string; label: string; node: React.ReactNode; }

export function AnalyticsDashboardView() {
  const tabs = useMemo<Tab[]>(() => [
    { key: "overview", label: "Visión General", node: <OverviewView /> },
    { key: "indicadores", label: "Indicadores", node: <IndicatorsView /> },
    { key: "acquisition", label: "Adquisición", node: <AcquisitionView /> },
    { key: "audience", label: "Audiencia", node: <AudienceView /> },
    { key: "behavior", label: "Comportamiento", node: <BehaviorView /> },
    { key: "conversions", label: "Conversiones", node: <ConversionsView /> },
    { key: "technology", label: "Tecnología", node: <TechnologyView /> },
  ], []);

  const [active, setActive] = useState(tabs[0].key);
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabBar tabs={tabs} active={active} onChange={setActive} groupId="analytics" />
        <DbStatus db="analytics" table="manual_metrics" />
      </div>

      {/* Solo se monta la pestaña activa: evita 7 fetches simultáneos a GA4 y
          el ruido de gráficas con 0px de ancho cuando están ocultas. */}
      <div key={current.key}>{current.node}</div>
    </div>
  );
}
