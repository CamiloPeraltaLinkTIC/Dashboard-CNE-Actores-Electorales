"use client";

import React, { useState, useEffect, useRef } from "react";
import { getDb } from "@/lib/supabase";
import {
  Calendar as CalendarIcon,
  Plus,
  History,
  BarChart3
} from "lucide-react";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { MonitoringForm } from "./MonitoringForm";
import { MonitoringHistoryModal } from "./MonitoringHistoryModal";
import { MonitoringHistoricalChart, MonitoringMonthlyTrendChart, SentimentFigures, CoverageChart, TierChart } from "./MonitoringCharts";
import { GeoMap } from "./GeoMap";
import { KPICard } from "./KPICard";
import { DbStatus } from "@/components/ui/DbStatus";
import { TabBar } from "@/components/ui/TabBar";
import { useLayout } from "@/context/LayoutContext";

const supabase = getDb("estrategia");

/* ====================== Vista Diaria ====================== */
function DailyView() {
  const { userRole } = useLayout();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [selectedDate, setSelectedDate] = useState(format(subDays(new Date(), 1), "yyyy-MM-dd"));
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentData, setCurrentData] = useState<any>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);

    // Load data for the selected date
    const { data: dayData, error: dayError } = await supabase
      .from("monitoreo_medios")
      .select("*")
      .eq("fecha", selectedDate)
      .single();

    if (dayData && !dayError) {
      setCurrentData(dayData);
    } else {
      setCurrentData(null);
    }

    // Load historical data (last 30 entries)
    const { data: histData, error: histError } = await supabase
      .from("monitoreo_medios")
      .select("*")
      .order("fecha", { ascending: false })
      .limit(30);

    if (histData && !histError) {
      setHistoricalData(histData);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const handleEditHistorical = (date: string) => {
    setSelectedDate(date);
    setShowHistory(false);
    setShowForm(true);
  };

  return (
    <div className="space-y-8 pb-12 transition-all">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-black text-[var(--text)]">Métricas Diarias</h1>
          <p className="text-[var(--text-dim)] font-medium text-sm">Impacto y métricas de medios del día seleccionado</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <CalendarIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-dim)] cursor-pointer hover:text-[var(--accent)] transition-colors z-10"
              onClick={() => dateInputRef.current?.showPicker()}
            />
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              max={format(subDays(new Date(), 1), "yyyy-MM-dd")}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-10 pr-4 py-2.5 glass text-sm font-bold text-[var(--text)] focus:neon-border focus:outline-none transition-all [color-scheme:dark]"
            />
          </div>
          {userRole === 'admin' && (
            <>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 accent-bg text-black px-5 py-2.5 rounded-xl font-bold hover:neon-glow transition-all"
              >
                <Plus className="w-4 h-4" />
                {currentData ? 'Editar Datos' : 'Ingresar Datos'}
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-2 glass text-[var(--text-dim)] hover:text-[var(--text)] px-5 py-2.5 rounded-xl font-bold transition-all"
              >
                <History className="w-4 h-4" />
                Historial
              </button>
            </>
          )}
        </div>
      </div>

      {/* Overview KPIs for the selected date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mt-6">
        <KPICard
          id="mentions"
          title="Menciones Totales"
          value={currentData?.menciones_totales?.toLocaleString('es-CO') || "0"}
          change={historicalData.length > 1 ? "Calculado" : "-"}
          trend="neutral"
          prevText="Aprox."
        />
        <KPICard
          id="audience"
          title="Audiencia Estimada"
          value={currentData?.audiencia_estimada?.toLocaleString('es-CO') || "0"}
          change="-"
          trend="neutral"
          prevText="Vistas aprox."
        />
        <KPICard
          id="sov"
          title="Share of Voice"
          value={currentData?.share_of_voice ? `${currentData.share_of_voice}%` : "0%"}
          change="-"
          trend="neutral"
          prevText="Aprox."
        />
        <KPICard
          id="ad-value"
          title="Costo publicitario estimado"
          value={currentData?.valor_publicitario ? `$${currentData.valor_publicitario.toLocaleString('es-CO')}` : "$0"}
          change="-"
          trend="neutral"
          prevText="Pesos Colombianos (COP) aprox."
        />
      </div>

      <div className="w-full mt-6">
        <MonitoringHistoricalChart data={historicalData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="space-y-6">
          <SentimentFigures
            positive={currentData?.sentimiento_positivo || 0}
            negative={currentData?.sentimiento_negativo || 0}
          />
          <CoverageChart
            tv={currentData?.cobertura_tv || 0}
            digital={currentData?.cobertura_digital || 0}
            radio={currentData?.cobertura_radio || 0}
            impresos={currentData?.cobertura_impresos || 0}
          />
          <TierChart
            tier1={currentData?.tier_1 || 0}
            tier2={currentData?.tier_2 || 0}
            tier3={currentData?.tier_3 || 0}
          />
        </div>
        <div className="lg:col-span-2">
          <GeoMap data={currentData?.ubicaciones || []} height="h-[1100px]" />
        </div>
      </div>

      {/* Modals */}
      {userRole === 'admin' && showForm && (
        <MonitoringForm
          date={selectedDate}
          onClose={() => setShowForm(false)}
          onSave={loadData}
        />
      )}
      {userRole === 'admin' && showHistory && (
        <MonitoringHistoryModal
          onClose={() => setShowHistory(false)}
          onEdit={handleEditHistorical}
        />
      )}
    </div>
  );
}

/* ====================== Vista Mensual ====================== */
function MonthlyView() {
  const monthInputRef = useRef<HTMLInputElement>(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [loading, setLoading] = useState(true);
  const [aggregatedData, setAggregatedData] = useState<any>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);

    const start = `${selectedMonth}-01`;
    const lastDay = new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]), 0).getDate();
    const end = `${selectedMonth}-${lastDay}`;

    // Load all data for the selected month
    const { data: monthData } = await supabase
      .from("monitoreo_medios")
      .select("*")
      .gte("fecha", start)
      .lte("fecha", end)
      .order("fecha", { ascending: true });

    if (monthData && monthData.length > 0) {
      setHistoricalData(monthData);

      // Aggregate data
      const totalMenciones = monthData.reduce((acc, curr) => acc + (curr.menciones_totales || 0), 0);
      const totalAudiencia = monthData.reduce((acc, curr) => acc + (curr.audiencia_estimada || 0), 0);
      const totalValor = monthData.reduce((acc, curr) => acc + (curr.valor_publicitario || 0), 0);
      const avgSov = monthData.reduce((acc, curr) => acc + (curr.share_of_voice || 0), 0) / monthData.length;
      const avgPositivo = monthData.reduce((acc, curr) => acc + (curr.sentimiento_positivo || 0), 0) / monthData.length;
      const avgNegativo = monthData.reduce((acc, curr) => acc + (curr.sentimiento_negativo || 0), 0) / monthData.length;

      const totalTV = monthData.reduce((acc, curr) => acc + (curr.cobertura_tv || 0), 0);
      const totalDigital = monthData.reduce((acc, curr) => acc + (curr.cobertura_digital || 0), 0);
      const totalRadio = monthData.reduce((acc, curr) => acc + (curr.cobertura_radio || 0), 0);
      const totalImpresos = monthData.reduce((acc, curr) => acc + (curr.cobertura_impresos || 0), 0);

      const totalTier1 = monthData.reduce((acc, curr) => acc + (curr.tier_1 || 0), 0);
      const totalTier2 = monthData.reduce((acc, curr) => acc + (curr.tier_2 || 0), 0);
      const totalTier3 = monthData.reduce((acc, curr) => acc + (curr.tier_3 || 0), 0);

      // Aggregate locations (combine weights for same city)
      const locationMap = new Map();
      monthData.forEach(day => {
        if (day.ubicaciones) {
          day.ubicaciones.forEach((loc: any) => {
            if (locationMap.has(loc.city)) {
              const existing = locationMap.get(loc.city);
              locationMap.set(loc.city, { ...existing, weight: existing.weight + loc.weight });
            } else {
              locationMap.set(loc.city, loc);
            }
          });
        }
      });

      setAggregatedData({
        menciones_totales: totalMenciones,
        audiencia_estimada: totalAudiencia,
        valor_publicitario: totalValor,
        share_of_voice: avgSov.toFixed(2),
        sentimiento_positivo: Math.round(avgPositivo),
        sentimiento_negativo: Math.round(avgNegativo),
        cobertura_tv: totalTV,
        cobertura_digital: totalDigital,
        cobertura_radio: totalRadio,
        cobertura_impresos: totalImpresos,
        tier_1: totalTier1,
        tier_2: totalTier2,
        tier_3: totalTier3,
        ubicaciones: Array.from(locationMap.values())
      });
    } else {
      setAggregatedData(null);
      setHistoricalData([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  return (
    <div className="space-y-8 pb-12 transition-all">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-black text-[var(--text)]">Informe Mensual</h1>
          <p className="text-[var(--text-dim)] font-medium text-sm">Resumen consolidado y tendencias del mes</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <CalendarIcon
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-dim)] cursor-pointer hover:text-[var(--accent)] transition-colors"
              onClick={() => monthInputRef.current?.showPicker()}
            />
            <input
              ref={monthInputRef}
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="pl-10 pr-4 py-2.5 glass text-sm font-bold text-[var(--text)] focus:neon-border focus:outline-none transition-all [color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      {!loading && !aggregatedData ? (
        <div className="glass p-12 text-center">
          <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-10 h-10 text-[var(--text-faint)]" />
          </div>
          <h3 className="text-xl font-bold text-[var(--text)] mb-2">No hay datos para este mes</h3>
          <p className="text-[var(--text-dim)] max-w-xs mx-auto">Selecciona otro periodo o ingresa datos diarios en la sección de Métricas Diarias.</p>
        </div>
      ) : (
        <>
          {/* Overview KPIs aggregated for the month */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 mt-6">
            <KPICard
              id="mentions-month"
              title="Menciones del Mes"
              value={aggregatedData?.menciones_totales?.toLocaleString() || "0"}
              change="Total acumulado"
              trend="neutral"
              prevText={format(new Date(selectedMonth + "-01T00:00:00"), "MMMM yyyy", { locale: es })}
            />
            <KPICard
              id="audience-month"
              title="Audiencia Total"
              value={aggregatedData?.audiencia_estimada?.toLocaleString() || "0"}
              change="Impacto acumulado"
              trend="neutral"
              prevText="Suma mensual estimada"
            />
            <KPICard
              id="sov-month"
              title="Promedio SOV"
              value={aggregatedData?.share_of_voice ? `${aggregatedData.share_of_voice}%` : "0%"}
              change="Media mensual"
              trend="neutral"
              prevText="Share of Voice promedio"
            />
            <KPICard
              id="ad-value-month"
              title="Inversión Equiv."
              value={aggregatedData?.valor_publicitario ? `$${aggregatedData.valor_publicitario.toLocaleString()}` : "$0"}
              change="Total consolidado"
              trend="neutral"
              prevText="Valor publicitario total"
            />
          </div>

          <div className="w-full mt-6">
            <MonitoringMonthlyTrendChart data={historicalData} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="space-y-6">
              <SentimentFigures
                positive={aggregatedData?.sentimiento_positivo || 0}
                negative={aggregatedData?.sentimiento_negativo || 0}
              />
              <CoverageChart
                tv={aggregatedData?.cobertura_tv || 0}
                digital={aggregatedData?.cobertura_digital || 0}
                radio={aggregatedData?.cobertura_radio || 0}
                impresos={aggregatedData?.cobertura_impresos || 0}
              />
              <TierChart
                tier1={aggregatedData?.tier_1 || 0}
                tier2={aggregatedData?.tier_2 || 0}
                tier3={aggregatedData?.tier_3 || 0}
              />
            </div>
            <div className="lg:col-span-2">
              <GeoMap data={aggregatedData?.ubicaciones || []} height="h-[1100px]" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ====================== Contenedor con pestañas ====================== */
const TABS = [
  { key: "diario", label: "Métricas Diarias" },
  { key: "mensual", label: "Informe Mensual" }
];

export function PrensaDashboardView() {
  const [active, setActive] = useState("diario");

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <TabBar tabs={TABS} active={active} onChange={setActive} groupId="prensa" />
        <DbStatus db="estrategia" />
      </div>

      {active === "diario" ? <DailyView /> : <MonthlyView />}
    </div>
  );
}
