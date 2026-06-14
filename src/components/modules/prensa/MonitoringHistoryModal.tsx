"use client";

import React, { useState, useEffect } from "react";
import { getDb } from "@/lib/supabase";
import { X, Calendar, Edit2, Loader2, Search } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const supabase = getDb("estrategia");

interface MonitoringHistoryModalProps {
  onClose: () => void;
  onEdit: (date: string) => void;
}

export function MonitoringHistoryModal({ onClose, onEdit }: MonitoringHistoryModalProps) {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadHistory() {
      const { data, error } = await supabase
        .from("monitoreo_medios")
        .select("*")
        .order("fecha", { ascending: false });

      if (data && !error) {
        setHistory(data);
      }
      setLoading(false);
    }
    loadHistory();
  }, []);

  const filteredHistory = history.filter(item =>
    item.fecha.includes(searchTerm)
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="glass-strong w-full max-w-5xl h-[80vh] rounded-3xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center" style={{ background: "var(--accent-soft)" }}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/5 border border-white/10 rounded-xl">
              <Calendar className="w-6 h-6 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[var(--text)]">Historial de Monitoreo</h2>
              <p className="text-[var(--text-dim)] text-sm font-medium">Registros históricos guardados en base de datos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 border-b border-white/10">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-dim)]" />
            <input
              type="text"
              placeholder="Buscar por fecha (YYYY-MM-DD)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl focus:neon-border focus:outline-none transition-all text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 text-[var(--accent)] animate-spin mb-4" />
              <p className="text-[var(--text-dim)] font-bold">Cargando historial...</p>
            </div>
          ) : filteredHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-xs text-[var(--text-dim)] uppercase font-black bg-white/5">
                  <tr>
                    <th className="px-4 py-4 rounded-l-xl">Fecha</th>
                    <th className="px-4 py-4">Menciones</th>
                    <th className="px-4 py-4">Audiencia</th>
                    <th className="px-4 py-4">Sent. (+)</th>
                    <th className="px-4 py-4">Sent. (-)</th>
                    <th className="px-4 py-4">Valor (COP)</th>
                    <th className="px-4 py-4">Tiers (1/2/3)</th>
                    <th className="px-4 py-4 rounded-r-xl text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredHistory.map((item) => (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4 font-bold text-[var(--text)]">
                        {format(new Date(item.fecha + "T00:00:00"), "dd MMM yyyy", { locale: es })}
                      </td>
                      <td className="px-4 py-4 font-medium text-[var(--text-dim)]">
                        {item.menciones_totales.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 font-medium text-[var(--text-dim)]">
                        {item.audiencia_estimada.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 font-bold text-emerald-400">
                        {item.sentimiento_positivo}%
                      </td>
                      <td className="px-4 py-4 font-bold text-rose-400">
                        {item.sentimiento_negativo}%
                      </td>
                      <td className="px-4 py-4 font-medium text-[var(--text-dim)]">
                        ${item.valor_publicitario.toLocaleString()}
                      </td>
                      <td className="px-4 py-4 font-medium text-[var(--text-dim)]">
                        <div className="flex gap-1 text-[10px]">
                          <span className="bg-white/5 px-1.5 py-0.5 rounded text-[var(--accent)] font-bold">{item.tier_1 || 0}</span>
                          <span className="bg-white/5 px-1.5 py-0.5 rounded text-emerald-400 font-bold">{item.tier_2 || 0}</span>
                          <span className="bg-white/5 px-1.5 py-0.5 rounded text-amber-400 font-bold">{item.tier_3 || 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => onEdit(item.fecha)}
                          className="p-2 text-[var(--accent)] hover:bg-white/5 rounded-lg transition-colors inline-flex items-center gap-2 font-bold"
                        >
                          <Edit2 className="w-4 h-4" />
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[var(--text-dim)]">
              <Calendar className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-bold">No se encontraron registros en el historial.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
