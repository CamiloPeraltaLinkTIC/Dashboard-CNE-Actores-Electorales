"use client";

import React, { useState, useEffect } from "react";
import { Users, Percent, Bot, MessageCircleOff, X, Save, Loader2, Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getDb } from "@/lib/supabase";

const supabase = getDb("estrategia");

interface CustosFormProps {
  date: string;
  onClose: () => void;
  onSave: () => void;
}

export function CustosForm({ date, onClose, onSave }: CustosFormProps) {
  const [metrics, setMetrics] = useState({
    usuarios_activos: "",
    porcentaje_usuarios: "",
    resoluciones_automatizadas: "",
    conversaciones_no_resueltas: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [date]);

  const loadData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('custos_metrics')
      .select('*')
      .eq('date', date)
      .single();

    if (data && !error) {
      setMetrics({
        usuarios_activos: data.usuarios_activos || "",
        porcentaje_usuarios: data.porcentaje_usuarios || "",
        resoluciones_automatizadas: data.resoluciones_automatizadas || "",
        conversaciones_no_resueltas: data.conversaciones_no_resueltas || ""
      });
    } else {
      setMetrics({
        usuarios_activos: "",
        porcentaje_usuarios: "",
        resoluciones_automatizadas: "",
        conversaciones_no_resueltas: ""
      });
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/soporte/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, ...metrics })
      });
      if (response.ok) {
        onSave();
        onClose();
      }
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-strong w-full max-w-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
              <Plus className="w-6 h-6 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[var(--text)]">Registrar Métricas</h2>
              <p className="text-sm font-medium text-[var(--text-dim)] mt-1">{format(new Date(date + "T00:00:00"), "EEEE, d 'de' MMMM", { locale: es })}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--text-dim)] hover:text-[var(--text)] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin mb-4" />
              <p className="text-[var(--text-dim)] font-medium">Cargando datos...</p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-[var(--text-dim)]">
                    <Users className="w-4 h-4 text-[var(--accent)]" />
                    Usuarios Activos
                  </label>
                  <input
                    type="number"
                    value={metrics.usuarios_activos}
                    onChange={(e) => setMetrics(p => ({ ...p, usuarios_activos: e.target.value }))}
                    className="w-full px-4 py-3 glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl font-bold focus:neon-border focus:outline-none transition-all"
                    placeholder="0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-[var(--text-dim)]">
                    <Percent className="w-4 h-4 text-amber-400" />
                    % de Usuarios Transferidos
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={metrics.porcentaje_usuarios}
                      onChange={(e) => setMetrics(p => ({ ...p, porcentaje_usuarios: e.target.value }))}
                      className="w-full pl-4 pr-8 py-3 glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl font-bold focus:neon-border focus:outline-none transition-all"
                      placeholder="0"
                      step="0.01"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-[var(--text-dim)]">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-[var(--text-dim)]">
                    <Bot className="w-4 h-4 text-emerald-400" />
                    Resoluciones Custos
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={metrics.resoluciones_automatizadas}
                      onChange={(e) => setMetrics(p => ({ ...p, resoluciones_automatizadas: e.target.value }))}
                      className="w-full pl-4 pr-8 py-3 glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl font-bold focus:neon-border focus:outline-none transition-all"
                      placeholder="0"
                      step="0.01"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-[var(--text-dim)]">%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-[var(--text-dim)]">
                    <MessageCircleOff className="w-4 h-4 text-rose-400" />
                    No Resueltas
                  </label>
                  <input
                    type="number"
                    value={metrics.conversaciones_no_resueltas}
                    onChange={(e) => setMetrics(p => ({ ...p, conversaciones_no_resueltas: e.target.value }))}
                    className="w-full px-4 py-3 glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl font-bold focus:neon-border focus:outline-none transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3.5 glass text-[var(--text-dim)] font-bold rounded-2xl hover:text-[var(--text)] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-[2] flex items-center justify-center gap-2 px-6 py-3.5 accent-bg text-black font-bold rounded-2xl hover:neon-glow transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {saving ? "Guardando..." : "Guardar Datos"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
