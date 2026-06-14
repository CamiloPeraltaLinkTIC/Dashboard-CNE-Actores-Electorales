"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getDb } from "@/lib/supabase";
const supabase = getDb("estrategia");
import { X, Save, Plus, AlertCircle, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLayout } from "@/context/LayoutContext";

interface EstrategiaFormProps {
  categoria: string;
  onSuccess: () => void;
  initialData?: any;
  selectedDate?: string;
  isMonthly?: boolean;
}

export function EstrategiaForm({ categoria, onSuccess, initialData, selectedDate, isMonthly = false }: EstrategiaFormProps) {
  const { userRole } = useLayout();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    fecha: selectedDate || (isMonthly ? format(new Date(), 'yyyy-MM-01') : format(new Date(), 'yyyy-MM-dd')),
    seguidores: "",
    nuevos_seguidores: "",
    num_publicaciones: "",
    contenidos_entregados: "",
    impresiones: "",
    reacciones_likes: "",
    comentarios_respuestas: "",
    social_performance_score: "",
    contenidos_publicados: "",
    sentimiento_positivo: "",
    sentimiento_negativo: "",
  });

  React.useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        fecha: initialData.fecha,
        seguidores: initialData.seguidores !== undefined ? String(initialData.seguidores) : "",
        nuevos_seguidores: initialData.nuevos_seguidores !== undefined ? String(initialData.nuevos_seguidores) : "",
        num_publicaciones: initialData.num_publicaciones !== undefined ? String(initialData.num_publicaciones) : "",
        contenidos_entregados: initialData.contenidos_entregados !== undefined ? String(initialData.contenidos_entregados) : "",
        impresiones: initialData.impresiones !== undefined ? String(initialData.impresiones) : "",
        reacciones_likes: initialData.reacciones_likes !== undefined ? String(initialData.reacciones_likes) : "",
        comentarios_respuestas: initialData.comentarios_respuestas !== undefined ? String(initialData.comentarios_respuestas) : "",
        social_performance_score: initialData.social_performance_score !== undefined ? String(initialData.social_performance_score) : "",
        contenidos_publicados: initialData.contenidos_publicados !== undefined ? String(initialData.contenidos_publicados) : "",
        sentimiento_positivo: initialData.sentimiento_positivo !== undefined ? String(initialData.sentimiento_positivo) : "",
        sentimiento_negativo: initialData.sentimiento_negativo !== undefined ? String(initialData.sentimiento_negativo) : "",
      });
    } else if (isOpen && !initialData) {
      setFormData(prev => ({
        ...prev,
        fecha: selectedDate || (isMonthly ? format(new Date(), 'yyyy-MM-01') : format(new Date(), 'yyyy-MM-dd'))
      }));
    }
  }, [isOpen, initialData, selectedDate, isMonthly]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'viewer') return;
    setIsLoading(true);
    setError("");

    try {
      let imageUrl = null;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${categoria}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('dashboard_images')
          .upload(fileName, imageFile);

        if (uploadError) {
          console.error("Upload error details:", uploadError);
          throw new Error("Error al subir la imagen. ¿Creaste el bucket 'dashboard_images' y es público?");
        }

        const { data: { publicUrl } } = supabase.storage
          .from('dashboard_images')
          .getPublicUrl(fileName);
        imageUrl = publicUrl;
      }

      const upsertData: any = {
        categoria,
        fecha: formData.fecha,
        seguidores: Number(formData.seguidores) || 0,
        nuevos_seguidores: Number(formData.nuevos_seguidores) || 0,
        num_publicaciones: Number(formData.num_publicaciones) || 0,
        contenidos_entregados: Number(formData.contenidos_entregados) || 0,
        impresiones: Number(formData.impresiones) || 0,
        reacciones_likes: Number(formData.reacciones_likes) || 0,
        comentarios_respuestas: Number(formData.comentarios_respuestas) || 0,
        social_performance_score: Number(formData.social_performance_score) || 0,
        contenidos_publicados: Number(formData.contenidos_publicados) || 0,
        sentimiento_positivo: Number(formData.sentimiento_positivo) || 0,
        sentimiento_negativo: Number(formData.sentimiento_negativo) || 0,
      };

      if (imageUrl) {
        upsertData.publicaciones_principales = imageUrl;
      }

      const { error: upsertError } = await supabase
        .from('estrategia_digital_metrics')
        .upsert(upsertData, { onConflict: 'fecha,categoria' });

      if (upsertError) throw upsertError;

      setIsOpen(false);
      setImageFile(null);
      onSuccess();
    } catch (err: any) {
      console.error("Error saving data:", err);
      setError(err.message || "Error al guardar los datos.");
    } finally {
      setIsLoading(false);
    }
  };

  if (userRole === 'viewer') return null;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 accent-bg text-black px-4 py-2.5 rounded-xl font-bold hover:neon-glow transition-all"
      >
        <Plus className="w-4 h-4" />
        {initialData ? "Editar / Ingresar" : "Ingresar Datos"}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="glass-strong rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-black text-[var(--text)]">Actualizar Métricas</h2>
            <p className="text-sm font-medium text-[var(--text-dim)] capitalize">{categoria.replace('-', ' ')}</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-[var(--text-dim)] hover:text-[var(--text)] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 text-rose-300 border-l-4 border-rose-500 rounded-r-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form id="metrics-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">Fecha</label>
                <input
                  type={isMonthly ? "month" : "date"}
                  name="fecha"
                  required
                  value={isMonthly ? formData.fecha.substring(0, 7) : formData.fecha}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      fecha: isMonthly ? `${val}-01` : val
                    }));
                  }}
                  className="w-full glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl px-4 py-3 focus:neon-border focus:outline-none transition-all font-medium"
                />
              </div>

              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">Social Performance Score (0 - 1000)</label>
                <input
                  type="number"
                  name="social_performance_score"
                  min="0"
                  max="1000"
                  step="any"
                  required
                  value={formData.social_performance_score}
                  onChange={handleChange}
                  className="w-full glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl px-4 py-3 focus:neon-border focus:outline-none transition-all font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">Sentimiento Positivo (%)</label>
                <input
                  type="number"
                  name="sentimiento_positivo"
                  min="0"
                  max="100"
                  step="any"
                  required
                  value={formData.sentimiento_positivo}
                  onChange={handleChange}
                  className="w-full glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl px-4 py-3 focus:neon-border focus:outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">Sentimiento Negativo (%)</label>
                <input
                  type="number"
                  name="sentimiento_negativo"
                  min="0"
                  max="100"
                  step="any"
                  required
                  value={formData.sentimiento_negativo}
                  onChange={handleChange}
                  className="w-full glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl px-4 py-3 focus:neon-border focus:outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">Seguidores</label>
                <input
                  type="number"
                  name="seguidores"
                  min="0"
                  required
                  value={formData.seguidores}
                  onChange={handleChange}
                  className="w-full glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl px-4 py-3 focus:neon-border focus:outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">Nuevos Seguidores</label>
                <input
                  type="number"
                  name="nuevos_seguidores"
                  required
                  value={formData.nuevos_seguidores}
                  onChange={handleChange}
                  className="w-full glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl px-4 py-3 focus:neon-border focus:outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">Nº Publicaciones</label>
                <input
                  type="number"
                  name="num_publicaciones"
                  min="0"
                  required
                  value={formData.num_publicaciones}
                  onChange={handleChange}
                  className="w-full glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl px-4 py-3 focus:neon-border focus:outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">Contenidos Entregados</label>
                <input
                  type="number"
                  name="contenidos_entregados"
                  min="0"
                  required
                  value={formData.contenidos_entregados}
                  onChange={handleChange}
                  className="w-full glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl px-4 py-3 focus:neon-border focus:outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">Contenidos Publicados</label>
                <input
                  type="number"
                  name="contenidos_publicados"
                  min="0"
                  required
                  value={formData.contenidos_publicados}
                  onChange={handleChange}
                  className="w-full glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl px-4 py-3 focus:neon-border focus:outline-none transition-all font-medium"
                />
              </div>

              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">Impresiones</label>
                <input
                  type="number"
                  name="impresiones"
                  min="0"
                  required
                  value={formData.impresiones}
                  onChange={handleChange}
                  className="w-full glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl px-4 py-3 focus:neon-border focus:outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">Reacciones / Me Gusta</label>
                <input
                  type="number"
                  name="reacciones_likes"
                  min="0"
                  required
                  value={formData.reacciones_likes}
                  onChange={handleChange}
                  className="w-full glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl px-4 py-3 focus:neon-border focus:outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">Comentarios / Resp</label>
                <input
                  type="number"
                  name="comentarios_respuestas"
                  min="0"
                  required
                  value={formData.comentarios_respuestas}
                  onChange={handleChange}
                  className="w-full glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl px-4 py-3 focus:neon-border focus:outline-none transition-all font-medium"
                />
              </div>

              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">Publicaciones Principales (Imagen)</label>
                <div className="relative w-full glass text-[var(--text)] rounded-xl px-4 py-3 focus-within:neon-border transition-all font-medium flex items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex items-center gap-2 pointer-events-none">
                    <Upload className="w-5 h-5 text-[var(--text-dim)]" />
                    <span className="text-sm text-[var(--text-dim)]">
                      {imageFile ? imageFile.name : "Seleccionar imagen..."}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-white/10 flex items-center justify-end gap-3 mt-auto">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="glass px-5 py-2.5 rounded-xl font-bold text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
          >
            Cancelar
          </button>
          <button
            form="metrics-form"
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 accent-bg text-black rounded-xl font-bold hover:neon-glow transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Guardar Datos
          </button>
        </div>
      </div>
    </div>
  );
}
