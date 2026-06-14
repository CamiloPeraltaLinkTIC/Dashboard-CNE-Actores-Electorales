"use client";

import React, { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getDb } from "@/lib/supabase";
import { KPICard } from "./RrssKpiCard";
import { EstrategiaForm } from "./EstrategiaForm";
import { Users, UserPlus, FileText, Send, Eye, Heart, MessageCircle, Activity } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar
} from "recharts";
import { useLayout } from "@/context/LayoutContext";
import { Calendar } from "lucide-react";

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

const COLORS = {
  primary: "#003893",
  secondary: "#fcd116",
  tertiary: "#ce1126",
  emerald: "#10b981",
  rose: "#f43f5e",
  blue: "#3b82f6",
  purple: "#8b5cf6",
};

export function SentimentFigures({ positive, negative, title }: { positive: any, negative: any, title?: string }) {
  // Extract numerical values safely in case they are text strings like "40%"
  const extractNumber = (val: any) => {
    if (val === undefined || val === null || val === '') return 0;
    // Replace comma decimal separator (Spanish format: "1,5" → "1.5")
    const normalized = String(val).replace(',', '.').replace(/[^0-9.-]+/g, '');
    const num = parseFloat(normalized);
    return isNaN(num) ? 0 : num;
  };

  const posNum = extractNumber(positive);
  const negNum = extractNumber(negative);

  // ALWAYS calculate automatically
  const finalNeutral = Number(Math.max(0, 100 - posNum - negNum).toFixed(1));

  // Helper to display % only if it's not already in the string
  const formatDisplay = (val: any) => {
    // Si es un número puro o string numérico, redondear a 1 decimal
    const num = Number(val);
    if (!isNaN(num) && val !== null && val !== '') {
      return `${Number(num.toFixed(1))}%`;
    }

    // Si ya trae texto como "40%"
    const str = String(val);
    return str.includes('%') ? str : `${str}%`;
  };

  return (
    <div className="glass p-6 h-full flex flex-col">
      <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4">{title ?? 'Análisis de Sentimiento'}</h3>
      <div className="flex-1 flex flex-col justify-center gap-3">

        <div className="flex items-center justify-between bg-emerald-500/10 rounded-2xl px-4 py-3">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Positivo</span>
          <span className="text-2xl font-black text-emerald-400">{formatDisplay(positive || 0)}</span>
        </div>

        <div className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-3">
          <span className="text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider">Neutral</span>
          <span className="text-2xl font-black text-[var(--text-dim)]">{formatDisplay(finalNeutral)}</span>
        </div>

        <div className="flex items-center justify-between bg-rose-500/10 rounded-2xl px-4 py-3">
          <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Negativo</span>
          <span className="text-2xl font-black text-rose-400">{formatDisplay(negative || 0)}</span>
        </div>

      </div>
    </div>
  );
}

export function EstrategiaDashboardView({ categoria, title, isMonthly = false }: { categoria: string, title: string, isMonthly?: boolean }) {
  const { userRole } = useLayout();
  const [data, setData] = useState<MetricsData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const getTodayString = () => {
    return isMonthly ? format(new Date(), 'yyyy-MM-01') : format(new Date(), 'yyyy-MM-dd');
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const { data: metrics, error } = await supabase
      .from('estrategia_digital_metrics')
      .select('*')
      .eq('categoria', categoria)
      .order('fecha', { ascending: true });

    if (error) {
      console.error("Error fetching data:", error);
    } else {
      setData(metrics || []);
    }
    setIsLoading(false);
  }, [categoria]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter data up to selected date
  const filteredData = React.useMemo(() => {
    if (!selectedDate) return data;
    return data.filter(item => item.fecha <= selectedDate);
  }, [data, selectedDate]);

  // Calculate latest stats
  const latest = filteredData.length > 0 ? filteredData[filteredData.length - 1] : null;
  const previous = filteredData.length > 1 ? filteredData[filteredData.length - 2] : null;

  const calculateTrend = (current: number, prev: number) => {
    if (!prev || prev === 0) return 0;
    return Number((((current - prev) / prev) * 100).toFixed(1));
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text)]">{title}</h1>
          <p className="text-sm font-medium text-[var(--text-dim)] mt-1">Métricas y rendimiento digital</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="glass flex items-center gap-2 px-3 py-2">
            <Calendar className="w-4 h-4 text-[var(--text-dim)]" />
            <input
              type={isMonthly ? "month" : "date"}
              value={isMonthly ? selectedDate.substring(0, 7) : selectedDate}
              max={isMonthly ? format(new Date(), 'yyyy-MM') : getTodayString()}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedDate(isMonthly ? `${val}-01` : val);
              }}
              className="text-sm border-none bg-transparent text-[var(--text)] placeholder:text-[var(--text-faint)] focus:neon-border focus:outline-none focus:ring-0 w-[120px]"
              title="Fecha del reporte"
            />
          </div>
          <EstrategiaForm categoria={categoria} onSuccess={fetchData} initialData={latest} selectedDate={selectedDate} isMonthly={isMonthly} />
        </div>
      </div>

      {isLoading ? (
        <div className="h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
        </div>
      ) : data.length === 0 ? (
        <div className="glass h-[60vh] flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-[var(--text-dim)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text)]">Aún no hay datos para {title}</h2>
          <p className="text-[var(--text-dim)] mt-2 max-w-md text-center">
            {userRole === 'viewer'
              ? "No se han registrado métricas para esta categoría todavía. Contacta al administrador."
              : "Ingresa los primeros datos usando el botón \"Ingresar Datos\" en la parte superior derecha."}
          </p>
        </div>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <KPICard
              title="Social Performance Score"
              value={latest?.social_performance_score || 0}
              icon={Activity}
              valueSuffix={<span className="text-lg text-[var(--text-dim)] font-bold">/1000</span>}
              colorClass="text-[var(--accent)]"
            />
            <KPICard
              title="Seguidores Totales"
              value={latest?.seguidores || 0}
              icon={Users}
            />
            <KPICard
              title="Nuevos Seguidores"
              value={latest?.nuevos_seguidores || 0}
              icon={UserPlus}
              colorClass="text-[#fcd116]"
            />
            <KPICard
              title="Impresiones de publicaciones"
              value={latest?.impresiones || 0}
              icon={Eye}
              colorClass="text-emerald-500"
            />
            <KPICard
              title="Reacciones y Likes de publicaciones"
              value={latest?.reacciones_likes || 0}
              icon={Heart}
              colorClass="text-rose-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Comentarios de publicaciones"
              value={latest?.comentarios_respuestas || 0}
              icon={MessageCircle}
              colorClass="text-orange-500"
            />
            <KPICard
              title="Publicaciones"
              value={latest?.num_publicaciones || 0}
              icon={FileText}
              colorClass="text-blue-500"
            />
            <KPICard
              title="Contenidos Entregados"
              value={latest?.contenidos_entregados || 0}
              icon={Send}
              colorClass="text-purple-500"
            />
            <KPICard
              title="Contenidos Publicados"
              value={latest?.contenidos_publicados || 0}
              icon={FileText}
              colorClass="text-emerald-600"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SentimentFigures
              positive={latest?.sentimiento_positivo || 0}
              negative={latest?.sentimiento_negativo || 0}
              title="Análisis de Sentimiento General"
            />

            {/* Publicaciones Principales (Imagen) */}
            <div className="glass p-6 h-[400px] flex flex-col">
              <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4">Publicaciones Principales</h3>
              <div className="flex-1 w-full relative bg-white/5 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
                {latest?.publicaciones_principales ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={latest.publicaciones_principales}
                    alt="Publicaciones Principales"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-[var(--text-dim)] flex flex-col items-center">
                    <Activity className="w-8 h-8 mb-2 opacity-30" />
                    <span className="text-sm font-medium">No hay captura disponible para esta fecha</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
