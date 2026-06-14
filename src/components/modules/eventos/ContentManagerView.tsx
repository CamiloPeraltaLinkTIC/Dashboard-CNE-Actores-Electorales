"use client";

import React, { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { getDb } from "@/lib/supabase";
import { useLayout } from "@/context/LayoutContext";
import { Calendar, Layout } from "lucide-react";
import { ListCard } from "@/components/modules/rrss/ListeningDashboardView";
import { ContentManagerForm } from "./ContentManagerForm";

const supabase = getDb("estrategia");

// Icons for hashtags
const HashtagIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="20" y2="15" />
    <line x1="10" y1="3" x2="8" y2="21" />
    <line x1="16" y1="3" x2="14" y2="21" />
  </svg>
);

// Premium Social Icons SVGs
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.06-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.03 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-1.48-.42-3.12-.14-4.39.77-.99.66-1.56 1.69-1.69 2.87-.24 1.45.42 2.93 1.68 3.69 1.19.78 2.39.46 3.49-.13.81-.5.98-1.41 1-2.31l-.01-11.89z"/>
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.335.935 20.665.333 19.882.63c-.765.296-1.636.499-2.913.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.58.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.27.07 1.645.07 4.85s-.015 3.579-.071 4.85c-.055 1.17-.249 1.805-.415 2.227-.217.562-.477.96-.896 1.382-.42.419-.819.679-1.381.896-.422.164-1.057.36-2.227.413-1.27.057-1.645.07-4.85.07s-3.579-.015-4.85-.07c-1.17-.055-1.805-.249-2.227-.415-.562-.217-.96-.477-1.382-.896-.419-.42-.679-.819-.896-1.381-.164-.422-.36-1.057-.413-2.227-.057-1.27-.07-1.645-.07-4.85s.015-3.579.07-4.85c.055-1.17.249-1.805.415-2.227.217-.562.477-.96.896-1.382.42-.419.819-.679 1.381-.896.422-.164 1.057-.36 2.227-.413 1.27-.057 1.645-.07 4.85-.07zM12 5.837a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932L18.9 1.153zM17.61 20.644h2.039L6.486 3.24H4.298L17.61 20.644z"/>
  </svg>
);

const REDES_CONFIG = [
  { id: "Tiktok", label: "Tiktok", icon: TikTokIcon },
  { id: "Facebook", label: "Facebook", icon: FacebookIcon },
  { id: "Instagram", label: "Instagram", icon: InstagramIcon },
  { id: "X", label: "X", icon: XIcon },
];

const HASHTAGS_CONFIG = [
  { id: "#CNEConLasRegiones", label: "#CNEConLasRegiones", icon: HashtagIcon },
  { id: "#LegitimidadYTransparencia", label: "#LegitimidadYTransparencia", icon: HashtagIcon },
  { id: "#Elecciones2026", label: "#Elecciones2026", icon: HashtagIcon },
];

interface ContentManagerMetrics {
  id: string;
  fecha: string;
  red_social: string;
  temas_sugeridos: { text: string, importance: string }[];
  temas_prohibidos: { text: string, importance: string }[];
  formatos_sugeridos: { text: string, importance: string }[];
  tendencias: { text: string, importance: string }[];
  hashtags?: { text: string, importance: string }[];
}

export function ContentManagerView({ categoria, title }: { categoria: string; title: string }) {
  const { userRole } = useLayout();
  const [data, setData] = useState<ContentManagerMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMainTab, setActiveMainTab] = useState<"redes" | "hashtags">("redes");
  const [activeTab, setActiveTab] = useState("Tiktok");

  const getTodayString = () => {
    return format(new Date(), 'yyyy-MM-dd');
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const { data: metrics, error } = await supabase
      .from('content_manager_metrics')
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

  const filteredByDate = React.useMemo(() => {
    if (!selectedDate) return data;
    return data.filter(item => item.fecha <= selectedDate);
  }, [data, selectedDate]);

  const latest = React.useMemo(() => {
    const entriesForTab = filteredByDate.filter(item => item.red_social === activeTab);
    return entriesForTab.length > 0 ? entriesForTab[entriesForTab.length - 1] : null;
  }, [filteredByDate, activeTab]);

  const handleMainTabChange = (tab: "redes" | "hashtags") => {
    setActiveMainTab(tab);
    if (tab === "redes") {
      setActiveTab("Tiktok");
    } else {
      setActiveTab("#CNEConLasRegiones");
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[var(--text)]">{title}</h1>
          <p className="text-sm font-medium text-[var(--text-dim)] mt-1">Estrategia de contenidos y tendencias</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 glass px-3 py-2 rounded-xl">
            <Calendar className="w-4 h-4 text-[var(--text-dim)]" />
            <input
              type="date"
              value={selectedDate}
              max={getTodayString()}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm border-none bg-transparent text-[var(--text)] focus:outline-none focus:ring-0 w-[110px]"
              title="Fecha del reporte"
            />
          </div>
          <ContentManagerForm
            categoria={categoria}
            redSocial={activeTab}
            onSuccess={fetchData}
            initialData={latest}
            selectedDate={selectedDate}
          />
        </div>
      </div>

      {/* Main Tabs Groups */}
      <div className="flex gap-4 border-b border-white/10">
        <button
          onClick={() => handleMainTabChange("redes")}
          className={`pb-3 px-2 text-sm font-bold transition-all ${activeMainTab === 'redes' ? "text-[var(--accent)] border-b-2 border-[var(--accent)]" : "text-[var(--text-dim)] hover:text-[var(--text)]"}`}
        >
          Redes Sociales
        </button>
        <button
          onClick={() => handleMainTabChange("hashtags")}
          className={`pb-3 px-2 text-sm font-bold transition-all ${activeMainTab === 'hashtags' ? "text-[var(--accent)] border-b-2 border-[var(--accent)]" : "text-[var(--text-dim)] hover:text-[var(--text)]"}`}
        >
          Hashtags
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-3 items-center animate-in fade-in slide-in-from-left-4 duration-300">
        {(activeMainTab === "redes" ? REDES_CONFIG : HASHTAGS_CONFIG).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-black transition-all duration-300 ${
                isActive
                  ? "accent-bg text-black neon-glow"
                  : "glass text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-white/5"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "animate-pulse" : ""}`} />
              {item.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)]"></div>
        </div>
      ) : data.length === 0 ? (
        <div className="h-[60vh] flex flex-col items-center justify-center glass rounded-3xl">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <Layout className="w-8 h-8 text-[var(--text-dim)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text)]">Aún no hay datos para {title}</h2>
          <p className="text-[var(--text-dim)] mt-2 max-w-md text-center">
            {userRole === 'viewer'
              ? "No se han registrado datos de planificación todavía. Contacta al administrador."
              : "Ingresa los primeros datos usando el botón \"Ingresar Datos\" en la parte superior derecha."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-500">
          <ListCard title="Temas sugeridos" items={latest?.temas_sugeridos || []} />
          <ListCard title="Temas que no se deben hablar" items={latest?.temas_prohibidos || []} />
          <ListCard title="Formatos sugeridos" items={latest?.formatos_sugeridos || []} />
          <ListCard title="Tendencia en la red" items={latest?.tendencias || []} />
        </div>
      )}
    </div>
  );
}
