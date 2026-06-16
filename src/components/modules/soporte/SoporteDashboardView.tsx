"use client";

import React, { useState, useEffect } from "react";
import { Users, Percent, Bot, MessageCircleOff } from "lucide-react";
import { es } from "date-fns/locale";
import { subDays, eachDayOfInterval, format as formatDate } from "date-fns";
import { useLayout } from "@/context/LayoutContext";
import { KPICard } from "@/components/modules/soporte/KPICard";
import { HistoryChart } from "@/components/modules/soporte/HistoryChart";
import { DashboardHeader } from "@/components/modules/soporte/DashboardHeader";
import { CustosForm } from "@/components/modules/soporte/CustosForm";
import { CustosHistoryModal } from "@/components/modules/soporte/CustosHistoryModal";

export function SoporteDashboardView() {
  const { userRole } = useLayout();
  const isAdmin = userRole === 'admin';

  const [selectedDate, setSelectedDate] = useState(formatDate(new Date(), "yyyy-MM-dd"));
  const [metrics, setMetrics] = useState({
    usuarios_activos: "",
    porcentaje_usuarios: "",
    resoluciones_automatizadas: "",
    conversaciones_no_resueltas: ""
  });
  const [rawHistory, setRawHistory] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Load initial history
  useEffect(() => {
    refreshHistory();
  }, []);

  // Generate the real daily values for the last 30 days (no rolling/accumulated)
  const history = React.useMemo(() => {
    // Build a complete daily sequence for the last 30 days, newest first.
    const end = new Date();
    const start = subDays(end, 29);
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const dateStr = formatDate(day, "yyyy-MM-dd");
      const existingData = rawHistory.find(h => h.date === dateStr);
      return existingData || {
        date: dateStr,
        usuarios_activos: 0,
        porcentaje_usuarios: 0,
        resoluciones_automatizadas: 0,
        conversaciones_no_resueltas: 0,
        isPlaceholder: true
      };
    }).sort((a, b) => b.date.localeCompare(a.date)); // Newest first
  }, [rawHistory]);

  // Metrics now reflect raw data from the database for the selected day
  useEffect(() => {
    if (rawHistory.length > 0) {
      const currentDay = rawHistory.find((d: any) => d.date === selectedDate);
      if (currentDay) {
        setMetrics({
          usuarios_activos: currentDay.usuarios_activos?.toString() || "0",
          porcentaje_usuarios: currentDay.porcentaje_usuarios?.toString() || "0",
          resoluciones_automatizadas: currentDay.resoluciones_automatizadas?.toString() || "0",
          conversaciones_no_resueltas: currentDay.conversaciones_no_resueltas?.toString() || "0"
        });
      } else {
        setMetrics({
          usuarios_activos: "0",
          porcentaje_usuarios: "0",
          resoluciones_automatizadas: "0",
          conversaciones_no_resueltas: "0"
        });
      }
    }
  }, [rawHistory, selectedDate]);

  const refreshHistory = async () => {
    const histResponse = await fetch('/api/soporte/metrics');
    const histData = await histResponse.json();
    setRawHistory(histData);
  };

  const handleEditHistorical = (date: string) => {
    if (!isAdmin) return;
    setSelectedDate(date);
    setShowHistory(false);
    setShowForm(true);
  };

  const hasDataForSelectedDate = metrics.usuarios_activos !== "0" || metrics.porcentaje_usuarios !== "0" || metrics.resoluciones_automatizadas !== "0" || metrics.conversaciones_no_resueltas !== "0";

  const currentDayDate = new Date(selectedDate + "T00:00:00");
  const prevDateText = `Día: ${formatDate(currentDayDate, "dd MMM yyyy", { locale: es })}`;

  return (
    <div className="space-y-8 pb-12">
      <DashboardHeader
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onShowForm={isAdmin ? () => setShowForm(true) : undefined}
        onShowHistory={() => setShowHistory(true)}
        hasDataForSelectedDate={hasDataForSelectedDate}
        isAdmin={isAdmin}
      />

      {/* Metrics Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <KPICard
          title="Usuarios Activos"
          value={Number(metrics.usuarios_activos || 0).toLocaleString("es-CO")}
          icon={Users}
          color="blue"
          prevText={prevDateText}
        />
        <KPICard
          title="% de Usuarios Transferidos"
          value={metrics.porcentaje_usuarios}
          icon={Percent}
          unit="%"
          color="yellow"
          prevText={prevDateText}
        />
        <KPICard
          title="Resoluciones Custos"
          value={metrics.resoluciones_automatizadas}
          icon={Bot}
          unit="%"
          color="green"
          prevText={prevDateText}
        />
        <KPICard
          title="Conversaciones No Resueltas"
          value={Number(metrics.conversaciones_no_resueltas || 0).toLocaleString("es-CO")}
          icon={MessageCircleOff}
          color="red"
          prevText={prevDateText}
        />
      </section>

      <HistoryChart data={history} />

      {/* Footer */}
      <footer className="text-center pt-10 pb-6">
        <p className="text-[var(--text-dim)] text-sm font-bold tracking-widest uppercase mb-2">Dashboard mesa de ayuda - Custos</p>
        <p className="text-[var(--text-faint)] text-xs">© 2024 Actores Electorales.</p>
      </footer>

      {showForm && (
        <CustosForm
          date={selectedDate}
          onClose={() => setShowForm(false)}
          onSave={refreshHistory}
        />
      )}

      {showHistory && (
        <CustosHistoryModal
          onClose={() => setShowHistory(false)}
          onEdit={handleEditHistorical}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
