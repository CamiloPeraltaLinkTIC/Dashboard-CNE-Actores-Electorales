"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { format } from "date-fns";
import { getDb } from "@/lib/supabase";
import { KPICard } from "./RrssKpiCard";
import { ListeningForm } from "./ListeningForm";
import { FileText, MessageCircle, Eye, Activity, Calendar, ArrowUp, ArrowDown } from "lucide-react";
import { useLayout } from "@/context/LayoutContext";
import { SentimentFigures } from "./EstrategiaDashboardView";

const supabase = getDb("estrategia");

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
  hashtags_para_usar: { text: string, importance: string }[];
  palabras_claves_para_usar: { text: string, importance: string }[];
  que_no_usar: { text: string, importance: string }[];
  cuentas_impacto: { nombre: string, identificador: string, impacto: string }[];
  sitios_impacto: { nombre: string, identificador: string, impacto: string }[];
  trend_resultados?: number;
  trend_interacciones?: number;
  trend_alcance_potencial?: number;
  cuota_emocion?: {
    [key: string]: {
      resultados: string;
      porcentaje: number;
      tendencia: string;
    };
  };
}

export function ListCard({ title, items }: { title: string, items: { text: string, importance: string }[] }) {
  return (
    <div className="glass p-6 flex flex-col min-h-[300px]">
      <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4">{title}</h3>
      <div className="flex-1 overflow-y-auto space-y-3">
        {!items || items.length === 0 ? (
          <div className="text-sm text-[var(--text-dim)] italic text-center mt-10">No hay datos</div>
        ) : (
          items.map((item, idx) => {
            const isAlta = item.importance === 'alta';
            const isMedia = item.importance === 'media';
            return (
              <div key={idx} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                <span className="text-sm font-bold text-[var(--text)]">{item.text}</span>
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${isAlta ? "bg-rose-500/10 text-rose-400" :
                  isMedia ? "bg-amber-500/10 text-amber-400" :
                    "bg-white/5 text-[var(--text-dim)]"
                  }`}>
                  {item.importance}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function ImpactCard({ title, items, isUrl }: { title: string, items: { nombre: string, identificador: string, impacto: string }[], isUrl?: boolean }) {
  const getEmoji = (imp: string) => {
    if (imp === 'positivo') return "😀";
    if (imp === 'negativo') return "😡";
    return "😐"; // neutral
  };

  return (
    <div className="glass p-6 flex flex-col min-h-[300px]">
      <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4">{title}</h3>
      <div className="flex-1 overflow-y-auto space-y-3">
        {!items || items.length === 0 ? (
          <div className="text-sm text-[var(--text-dim)] italic text-center mt-10">No hay datos</div>
        ) : (
          items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[var(--text)]">{item.nombre}</span>
                {isUrl ? (
                  <a href={item.identificador.startsWith('http') ? item.identificador : `https://${item.identificador}`} target="_blank" rel="noreferrer" className="text-xs text-[var(--accent)] hover:underline">{item.identificador}</a>
                ) : (
                  <span className="text-xs text-[var(--text-dim)]">{item.identificador}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-full ${item.impacto === 'positivo' ? 'bg-emerald-500/10 text-emerald-400' :
                  item.impacto === 'negativo' ? 'bg-rose-500/10 text-rose-400' :
                    'bg-white/5 text-[var(--text-dim)]'
                  }`}>
                  {item.impacto === 'positivo' ? 'Positivo' : item.impacto === 'negativo' ? 'Negativo' : 'Neutral'}
                </span>
                <span className="text-2xl" title={item.impacto}>
                  {getEmoji(item.impacto)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function EmotionShareCard({ cuota }: { cuota?: ListeningMetrics["cuota_emocion"] }) {
  const emotionsConfig = [
    { key: "Alegria", name: "Alegría", emoji: "😀", color: "bg-emerald-500", trackColor: "bg-emerald-500/10", textColor: "text-emerald-400" },
    { key: "Amor", name: "Amor", emoji: "😍", color: "bg-pink-500", trackColor: "bg-pink-500/10", textColor: "text-pink-400" },
    { key: "Sorpresa", name: "Sorpresa", emoji: "😮", color: "bg-orange-500", trackColor: "bg-orange-500/10", textColor: "text-orange-400" },
    { key: "Tristeza", name: "Tristeza", emoji: "😢", color: "bg-blue-500", trackColor: "bg-blue-500/10", textColor: "text-blue-400" },
    { key: "Miedo", name: "Miedo", emoji: "😨", color: "bg-purple-500", trackColor: "bg-purple-500/10", textColor: "text-purple-400" },
    { key: "Ira", name: "Ira", emoji: "😡", color: "bg-rose-500", trackColor: "bg-rose-500/10", textColor: "text-rose-400" },
  ];

  return (
    <div className="glass p-6 flex flex-col min-h-[300px]">
      <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4">Cuota de Emoción</h3>
      <div className="flex-1 space-y-4">
        {!cuota || Object.keys(cuota).length === 0 ? (
          <div className="text-sm text-[var(--text-dim)] italic text-center mt-10">No hay datos de emociones</div>
        ) : (
          emotionsConfig.map(({ key, name, emoji, color, trackColor, textColor }) => {
            const emotionData = cuota[key] || { resultados: "0", porcentaje: 0, tendencia: "igual" };
            const porcentajeVal = Number(emotionData.porcentaje) || 0;
            const resultadosVal = emotionData.resultados || "0";
            const tendenciaVal = emotionData.tendencia;

            return (
              <div key={key} className="space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-[var(--text-dim)]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{emoji}</span>
                    <span>{name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-8 bg-white/5 rounded-xl overflow-hidden relative border border-white/10 flex items-center">
                    {porcentajeVal > 0 && (
                      <div
                        className={`h-full ${color} transition-all duration-500 flex items-center justify-start pl-3`}
                        style={{ width: `${Math.max(porcentajeVal, 15)}%` }}
                      >
                        <span className="text-white text-xs font-black drop-shadow flex items-center gap-1 select-none">
                          {tendenciaVal === "subio" && <ArrowUp className="w-3.5 h-3.5 stroke-[3] text-white" />}
                          {tendenciaVal === "bajo" && <ArrowDown className="w-3.5 h-3.5 stroke-[3] text-white" />}
                          {porcentajeVal}%
                        </span>
                      </div>
                    )}
                    {porcentajeVal === 0 && (
                      <span className="text-[var(--text-dim)] text-xs font-medium pl-3 flex items-center gap-1">
                        0%
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-extrabold text-[var(--text)] min-w-[50px] text-right">
                    {resultadosVal}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function ListeningDashboardView({ categoria, title, isMonthly = false }: { categoria: string; title: string; isMonthly?: boolean }) {
  const { userRole } = useLayout();
  const [data, setData] = useState<ListeningMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const getTodayString = () => {
    return isMonthly ? format(new Date(), 'yyyy-MM-01') : format(new Date(), 'yyyy-MM-dd');
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const { data: metrics, error } = await supabase
      .from('listening_metrics')
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

  const filteredData = React.useMemo(() => {
    if (!selectedDate) return data;
    return data.filter(item => item.fecha <= selectedDate);
  }, [data, selectedDate]);

  const latest = filteredData.length > 0 ? filteredData[filteredData.length - 1] : null;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
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
              max={isMonthly ? format(new Date(), 'yyyy-MM') : getTodayString()}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedDate(isMonthly ? `${val}-01` : val);
              }}
              className="text-sm border-none bg-transparent text-[var(--text)] focus:neon-border focus:outline-none focus:ring-0 w-[120px]"
              title="Fecha del reporte"
            />
          </div>
          <ListeningForm categoria={categoria} onSuccess={fetchData} initialData={latest} selectedDate={selectedDate} isMonthly={isMonthly} />
        </div>
      </div>

      {isLoading ? (
        <div className="h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
        </div>
      ) : data.length === 0 ? (
        <div className="h-[60vh] flex flex-col items-center justify-center glass">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <Activity className="w-8 h-8 text-[var(--text-dim)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text)]">Aún no hay datos para {title}</h2>
          <p className="text-[var(--text-dim)] mt-2 max-w-md text-center">
            {userRole === 'viewer'
              ? "No se han registrado métricas para esta sección todavía. Contacta al administrador."
              : "Ingresa los primeros datos usando el botón \"Ingresar Datos\" en la parte superior derecha."}
          </p>
        </div>
      ) : (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <KPICard
              title="Resultados"
              value={latest?.resultados || 0}
              icon={FileText}
              colorClass="text-[var(--accent)]"
              trend={latest?.trend_resultados}
            />
            <KPICard
              title="Interacciones"
              value={latest?.interacciones || 0}
              icon={MessageCircle}
              colorClass="text-emerald-400"
              trend={latest?.trend_interacciones}
            />
            <KPICard
              title="Alcance Potencial"
              value={latest?.alcance_potencial || 0}
              icon={Eye}
              colorClass="text-purple-400"
              trend={latest?.trend_alcance_potencial}
            />
          </div>

          {/* Sentimiento + Cuota de Emoción + Activity Peak */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SentimentFigures
              positive={latest?.sentimiento_positivo || 0}
              negative={latest?.sentimiento_negativo || 0}
              title="Análisis de Sentimiento de la conversación"
            />
            <EmotionShareCard cuota={latest?.cuota_emocion} />
            <div className="glass p-6 min-h-[300px] flex flex-col">
              <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4">Activity Peak</h3>
              <div className="flex-1 w-full relative bg-white/5 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
                {latest?.activity_peak ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={latest.activity_peak}
                    alt="Activity Peak"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-[var(--text-dim)] flex flex-col items-center">
                    <Activity className="w-8 h-8 mb-2 opacity-30" />
                    <span className="text-sm font-medium text-center">No hay captura disponible<br />para esta fecha</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hashtags (Ocupa fila completa) */}
          <div className="glass p-6 min-h-[500px] flex flex-col w-full">
            <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4">Hashtags</h3>
            <div className="flex-1 w-full relative bg-white/5 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
              {latest?.hashtags ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={latest.hashtags}
                  alt="Hashtags"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-[var(--text-dim)] flex flex-col items-center">
                  <Activity className="w-8 h-8 mb-2 opacity-30" />
                  <span className="text-sm font-medium text-center">No hay captura disponible<br />para esta fecha</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <ImpactCard title="Cuentas con Mayor Impacto" items={latest?.cuentas_impacto || []} />
            <ImpactCard title="Sitios con Mayor Impacto" items={latest?.sitios_impacto || []} isUrl />
          </div>

          {/* List Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <ListCard title="Hashtags para usar" items={latest?.hashtags_para_usar || []} />
            <ListCard title="Palabras Claves para usar" items={latest?.palabras_claves_para_usar || []} />
            <ListCard title="Qué NO usar" items={latest?.que_no_usar || []} />
          </div>
        </>
      )}
    </div>
  );
}
