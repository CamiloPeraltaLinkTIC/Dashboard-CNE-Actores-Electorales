"use client";

import React, { useState, useEffect } from "react";
import { getDb } from "@/lib/supabase";
import { X, Save, Loader2, Plus, Trash2 } from "lucide-react";

const supabase = getDb("estrategia");

interface MonitoringFormProps {
  date: string;
  onClose: () => void;
  onSave: () => void;
}

const COLOMBIA_CAPITALS = [
  { city: "AMAZONAS", lat: 4.21, lng: -69.29, weight: 0 },
  { city: "ANTIOQUIA", lat: 6.23, lng: -75.59, weight: 0 },
  { city: "ARAUCA", lat: 7.08, lng: -70.76, weight: 0 },
  { city: "ATLÁNTICO", lat: 10.96, lng: -74.79, weight: 0 },
  { city: "BOLÍVAR", lat: 10.42, lng: -75.53, weight: 0 },
  { city: "BOYACÁ", lat: 5.53, lng: -73.36, weight: 0 },
  { city: "CALDAS", lat: 5.06, lng: -75.50, weight: 0 },
  { city: "CAQUETÁ", lat: 1.61, lng: -75.61, weight: 0 },
  { city: "CASANARE", lat: 5.33, lng: -72.39, weight: 0 },
  { city: "CAUCA", lat: 2.44, lng: -76.61, weight: 0 },
  { city: "CESAR", lat: 10.46, lng: -73.25, weight: 0 },
  { city: "CHOCÓ", lat: 5.68, lng: -76.65, weight: 0 },
  { city: "CÓRDOBA", lat: 8.75, lng: -75.88, weight: 0 },
  { city: "CUNDINAMARCA", lat: 4.6, lng: -74.08, weight: 0 },
  { city: "GUAINÍA", lat: 3.86, lng: -67.92, weight: 0 },
  { city: "GUAVIARE", lat: 2.56, lng: -72.63, weight: 0 },
  { city: "HUILA", lat: 2.92, lng: -75.28, weight: 0 },
  { city: "LA GUAJIRA", lat: 11.54, lng: -72.90, weight: 0 },
  { city: "MAGDALENA", lat: 11.24, lng: -74.20, weight: 0 },
  { city: "META", lat: 4.07, lng: -73.49, weight: 0 },
  { city: "NARIÑO", lat: 1.21, lng: -77.27, weight: 0 },
  { city: "NORTE DE SANTANDER", lat: 7.9, lng: -72.50, weight: 0 },
  { city: "PUTUMAYO", lat: -0.18, lng: -74.78, weight: 0 },
  { city: "QUINDÍO", lat: 4.53, lng: -75.68, weight: 0 },
  { city: "RISARALDA", lat: 4.81, lng: -75.69, weight: 0 },
  { city: "SAN ANDRÉS Y PROVIDENCIA", lat: 12.58, lng: -81.69, weight: 0 },
  { city: "SANTANDER", lat: 6.66, lng: -73.45, weight: 0 },
  { city: "SUCRE", lat: 9.29, lng: -75.39, weight: 0 },
  { city: "TOLIMA", lat: 4.43, lng: -75.26, weight: 0 },
  { city: "VALLE DEL CAUCA", lat: 3.45, lng: -76.53, weight: 0 },
  { city: "VAUPÉS", lat: 1.25, lng: -70.23, weight: 0 },
  { city: "VICHADA", lat: 6.18, lng: -67.48, weight: 0 }
];

const inputClass = "w-full px-4 py-3 glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl focus:neon-border focus:outline-none transition-all";

export function MonitoringForm({ date, onClose, onSave }: MonitoringFormProps) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    menciones_totales: 0,
    audiencia_estimada: 0,
    share_of_voice: 0,
    sentimiento_positivo: 0,
    sentimiento_negativo: 0,
    cobertura_tv: 0,
    cobertura_digital: 0,
    cobertura_radio: 0,
    cobertura_impresos: 0,
    valor_publicitario: 0,
    tier_1: 0,
    tier_2: 0,
    tier_3: 0,
    ubicaciones: [] as { city: string, lat: number, lng: number, weight: number }[]
  });

  useEffect(() => {
    async function loadData() {
      setFetching(true);
      const { data, error } = await supabase
        .from("monitoreo_medios")
        .select("*")
        .eq("fecha", date)
        .single();

      if (data && !error) {
        setFormData({
          menciones_totales: data.menciones_totales,
          audiencia_estimada: data.audiencia_estimada,
          share_of_voice: data.share_of_voice,
          sentimiento_positivo: data.sentimiento_positivo,
          sentimiento_negativo: data.sentimiento_negativo,
          cobertura_tv: data.cobertura_tv,
          cobertura_digital: data.cobertura_digital,
          cobertura_radio: data.cobertura_radio,
          cobertura_impresos: data.cobertura_impresos || 0,
          valor_publicitario: data.valor_publicitario,
          tier_1: data.tier_1 || 0,
          tier_2: data.tier_2 || 0,
          tier_3: data.tier_3 || 0,
          ubicaciones: data.ubicaciones && data.ubicaciones.length > 0 ? data.ubicaciones : COLOMBIA_CAPITALS
        });
      } else {
        // Reset if no data for date, use default cities
        setFormData({
          menciones_totales: 0,
          audiencia_estimada: 0,
          share_of_voice: 0,
          sentimiento_positivo: 0,
          sentimiento_negativo: 0,
          cobertura_tv: 0,
          cobertura_digital: 0,
          cobertura_radio: 0,
          cobertura_impresos: 0,
          valor_publicitario: 0,
          tier_1: 0,
          tier_2: 0,
          tier_3: 0,
          ubicaciones: COLOMBIA_CAPITALS
        });
      }
      setFetching(false);
    }
    loadData();
  }, [date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from("monitoreo_medios")
      .upsert({
        fecha: date,
        ...formData
      }, { onConflict: 'fecha' });

    setLoading(false);
    if (!error) {
      onSave();
      onClose();
    } else {
      alert("Error al guardar los datos: " + error.message);
    }
  };

  const addLocation = () => {
    setFormData({
      ...formData,
      ubicaciones: [...formData.ubicaciones, { city: "", lat: 4.6, lng: -74.0, weight: 1 }]
    });
  };

  const removeLocation = (index: number) => {
    const newUbicaciones = [...formData.ubicaciones];
    newUbicaciones.splice(index, 1);
    setFormData({ ...formData, ubicaciones: newUbicaciones });
  };

  const updateLocation = (index: number, field: string, value: any) => {
    const newUbicaciones = [...formData.ubicaciones];
    newUbicaciones[index] = { ...newUbicaciones[index], [field]: value };
    setFormData({ ...formData, ubicaciones: newUbicaciones });
  };

  if (fetching) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center">
        <div className="glass-strong p-8 rounded-3xl flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-[var(--accent)] animate-spin mb-4" />
          <p className="font-bold text-[var(--text-dim)]">Cargando datos para {date}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="glass-strong w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center" style={{ background: "var(--accent-soft)" }}>
          <div>
            <h2 className="text-xl font-black text-[var(--text)]">Ingreso de Datos de Monitoreo</h2>
            <p className="text-[var(--text-dim)] text-sm font-medium">Fecha seleccionada: {date}</p>
          </div>
          <button onClick={onClose} className="p-2 text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Métricas Generales */}
          <section>
            <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Métricas Generales</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-dim)] uppercase">Menciones Totales</label>
                <input
                  type="number"
                  value={formData.menciones_totales}
                  onChange={(e) => setFormData({ ...formData, menciones_totales: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-dim)] uppercase">Audiencia Estimada</label>
                <input
                  type="number"
                  value={formData.audiencia_estimada}
                  onChange={(e) => setFormData({ ...formData, audiencia_estimada: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-dim)] uppercase">Share of Voice (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.share_of_voice}
                  onChange={(e) => setFormData({ ...formData, share_of_voice: parseFloat(e.target.value) || 0 })}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Sentimiento y Valor */}
          <section>
            <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Sentimiento y Valoración</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-dim)] uppercase">Sentimiento Positivo (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.sentimiento_positivo}
                  onChange={(e) => setFormData({ ...formData, sentimiento_positivo: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-emerald-400 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-dim)] uppercase">Sentimiento Negativo (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.sentimiento_negativo}
                  onChange={(e) => setFormData({ ...formData, sentimiento_negativo: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none focus:border-rose-400 transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-dim)] uppercase">Valor Publicitario (COP)</label>
                <input
                  type="number"
                  value={formData.valor_publicitario}
                  onChange={(e) => setFormData({ ...formData, valor_publicitario: parseFloat(e.target.value) || 0 })}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Cobertura por Medio */}
          <section>
            <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Cobertura por Tipo de Medio</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-dim)] uppercase">Televisión</label>
                <input
                  type="number"
                  value={formData.cobertura_tv}
                  onChange={(e) => setFormData({ ...formData, cobertura_tv: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-dim)] uppercase">Digital</label>
                <input
                  type="number"
                  value={formData.cobertura_digital}
                  onChange={(e) => setFormData({ ...formData, cobertura_digital: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-dim)] uppercase">Radio</label>
                <input
                  type="number"
                  value={formData.cobertura_radio}
                  onChange={(e) => setFormData({ ...formData, cobertura_radio: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-dim)] uppercase">Impresos</label>
                <input
                  type="number"
                  value={formData.cobertura_impresos}
                  onChange={(e) => setFormData({ ...formData, cobertura_impresos: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Distribución por Tier */}
          <section>
            <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Distribución por Tier</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-dim)] uppercase">Tier 1</label>
                <input
                  type="number"
                  value={formData.tier_1}
                  onChange={(e) => setFormData({ ...formData, tier_1: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-dim)] uppercase">Tier 2</label>
                <input
                  type="number"
                  value={formData.tier_2}
                  onChange={(e) => setFormData({ ...formData, tier_2: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[var(--text-dim)] uppercase">Tier 3</label>
                <input
                  type="number"
                  value={formData.tier_3}
                  onChange={(e) => setFormData({ ...formData, tier_3: parseInt(e.target.value) || 0 })}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Mapa de Calor / Ubicaciones */}
          <section>
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
              <h3 className="text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider">Ubicaciones para Mapa de Calor</h3>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, ubicaciones: COLOMBIA_CAPITALS })}
                  className="flex items-center gap-1 text-xs font-bold text-rose-300 hover:underline"
                >
                  Restablecer Ciudades
                </button>
                <button
                  type="button"
                  onClick={addLocation}
                  className="flex items-center gap-1 text-xs font-bold text-[var(--accent)] hover:underline"
                >
                  <Plus className="w-4 h-4" /> Agregar Ciudad
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {formData.ubicaciones.map((loc, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 glass p-4 rounded-2xl relative">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[var(--text-faint)] uppercase">Ciudad</label>
                    <input
                      type="text"
                      value={loc.city}
                      onChange={(e) => updateLocation(index, 'city', e.target.value)}
                      placeholder="Ej: Bogotá"
                      className="w-full px-3 py-2 glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-lg text-sm focus:neon-border focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[var(--text-faint)] uppercase">Latitud</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={loc.lat}
                      onChange={(e) => updateLocation(index, 'lat', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-lg text-sm focus:neon-border focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[var(--text-faint)] uppercase">Longitud</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={loc.lng}
                      onChange={(e) => updateLocation(index, 'lng', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-lg text-sm focus:neon-border focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[var(--text-faint)] uppercase">Peso (Menciones)</label>
                    <input
                      type="number"
                      value={loc.weight}
                      onChange={(e) => updateLocation(index, 'weight', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-lg text-sm focus:neon-border focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLocation(index)}
                    className="absolute -top-2 -right-2 p-1.5 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded-full hover:bg-rose-500/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {formData.ubicaciones.length === 0 && (
                <div className="text-center p-8 border-2 border-dashed border-white/10 rounded-2xl text-[var(--text-dim)] text-sm">
                  No hay ubicaciones registradas para esta fecha.
                </div>
              )}
            </div>
          </section>
        </form>

        <div className="p-6 border-t border-white/10 flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            className="glass px-6 py-3 rounded-xl font-bold text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 accent-bg text-black px-8 py-3 rounded-xl font-bold hover:neon-glow transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Guardar Datos
          </button>
        </div>
      </div>
    </div>
  );
}
