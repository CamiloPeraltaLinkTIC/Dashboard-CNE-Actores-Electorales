"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Edit2 } from "lucide-react";
import { getDb } from "@/lib/supabase";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const supabase = getDb("estrategia");

interface CustosHistoryModalProps {
  onClose: () => void;
  onEdit: (date: string) => void;
  isAdmin: boolean;
}

export function CustosHistoryModal({ onClose, onEdit, isAdmin }: CustosHistoryModalProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];

    const { data: historyData } = await supabase
      .from("custos_metrics")
      .select("*")
      .gte('date', startDate)
      .order("date", { ascending: false });

    setData(historyData || []);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-strong w-full max-w-4xl rounded-3xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
          <div>
            <h2 className="text-xl font-black text-[var(--text)]">Historial de Métricas</h2>
            <p className="text-sm font-medium text-[var(--text-dim)] mt-1">Datos de los últimos 30 días</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--text-dim)] hover:text-[var(--text)] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin mb-4" />
              <p className="text-[var(--text-dim)] font-medium">Cargando historial...</p>
            </div>
          ) : (
            <div className="glass rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-[var(--text-dim)] font-bold">
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Usuarios Activos</th>
                    <th className="px-6 py-4">% Us. Transferidos</th>
                    <th className="px-6 py-4">Res. Automatizadas</th>
                    <th className="px-6 py-4">No Resueltas</th>
                    {isAdmin && <th className="px-6 py-4 text-right">Acción</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-[var(--text-dim)]">
                        No hay datos históricos disponibles.
                      </td>
                    </tr>
                  ) : (
                    data.map((row) => (
                      <tr key={row.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[var(--text)]">
                          {format(new Date(row.date + "T00:00:00"), "dd MMM", { locale: es })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--text-dim)]">
                          {row.usuarios_activos?.toLocaleString() || "0"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--text-dim)]">
                          {row.porcentaje_usuarios || "0"}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-400">
                          {row.resoluciones_automatizadas || "0"}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-rose-400">
                          {row.conversaciones_no_resueltas?.toLocaleString() || "0"}
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => onEdit(row.date)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[var(--accent)] bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                              Editar
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
