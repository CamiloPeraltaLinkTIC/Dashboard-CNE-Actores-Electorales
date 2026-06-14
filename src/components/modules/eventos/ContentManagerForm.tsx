"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { getDb } from "@/lib/supabase";
import { X, Save, Plus, AlertCircle, Loader2, Minus } from "lucide-react";
import { useLayout } from "@/context/LayoutContext";

const supabase = getDb("estrategia");

interface ContentManagerFormProps {
  categoria: string;
  redSocial: string;
  onSuccess: () => void;
  initialData?: any;
  selectedDate?: string;
}

function DynamicListInput({ label, items, onChange, pendingValue, setPendingValue }: {
  label: string,
  items: { text: string, importance: string }[],
  onChange: (items: { text: string, importance: string }[]) => void,
  pendingValue?: string,
  setPendingValue?: (val: string) => void
}) {
  const [text, setText] = useState("");
  const [importance, setImportance] = useState("alta");

  const handleAdd = () => {
    const valueToAdd = pendingValue !== undefined ? pendingValue : text;
    if (!valueToAdd.trim()) return;
    onChange([...items, { text: valueToAdd.trim(), importance }]);
    if (setPendingValue) setPendingValue("");
    setText("");
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="col-span-1 sm:col-span-2 space-y-2">
      <label className="block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={pendingValue !== undefined ? pendingValue : text}
          onChange={e => {
            if (setPendingValue) setPendingValue(e.target.value);
            else setText(e.target.value);
          }}
          className="flex-1 glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl px-4 py-3 focus:neon-border focus:outline-none transition-all font-medium"
          placeholder="Escribe y presiona Enter o el botón (+)"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <select
          value={importance}
          onChange={e => setImportance(e.target.value)}
          className="glass text-[var(--text)] rounded-xl px-3 py-3 focus:neon-border focus:outline-none transition-all font-medium"
        >
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
        <button
          type="button"
          onClick={handleAdd}
          className="shrink-0 accent-bg text-black rounded-xl px-3 hover:neon-glow transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      {items.length > 0 && (
        <div className="space-y-2 pt-2">
          {items.map((item, idx) => {
            const isAlta = item.importance === 'alta';
            const isMedia = item.importance === 'media';
            return (
              <div key={idx} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                <span className="text-sm font-bold text-[var(--text)]">{item.text}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${isAlta ? "bg-rose-500/10 text-rose-300" :
                    isMedia ? "bg-amber-500/10 text-amber-300" :
                      "bg-white/5 text-[var(--text-dim)]"
                    }`}>
                    {item.importance}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1 text-[var(--text-faint)] hover:text-rose-300 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ContentManagerForm({ categoria, redSocial, onSuccess, initialData, selectedDate }: ContentManagerFormProps) {
  const { userRole } = useLayout();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    fecha: selectedDate || format(new Date(), 'yyyy-MM-dd'),
  });

  const [temasSugeridos, setTemasSugeridos] = useState<{ text: string, importance: string }[]>([]);
  const [temasProhibidos, setTemasProhibidos] = useState<{ text: string, importance: string }[]>([]);
  const [formatosSugeridos, setFormatosSugeridos] = useState<{ text: string, importance: string }[]>([]);
  const [tendencias, setTendencias] = useState<{ text: string, importance: string }[]>([]);
  const [hashtags, setHashtags] = useState<{ text: string, importance: string }[]>([]);

  // Pending values for inputs
  const [pendingSugerido, setPendingSugerido] = useState("");
  const [pendingProhibido, setPendingProhibido] = useState("");
  const [pendingFormato, setPendingFormato] = useState("");
  const [pendingTendencia, setPendingTendencia] = useState("");
  const [pendingHashtag, setPendingHashtag] = useState("");

  React.useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        fecha: initialData.fecha,
      });
      setTemasSugeridos(initialData.temas_sugeridos || []);
      setTemasProhibidos(initialData.temas_prohibidos || []);
      setFormatosSugeridos(initialData.formatos_sugeridos || []);
      setTendencias(initialData.tendencias || []);
      setHashtags(initialData.hashtags || []);
    } else if (isOpen && !initialData) {
      setFormData({
        fecha: selectedDate || format(new Date(), 'yyyy-MM-dd'),
      });
      setTemasSugeridos([]);
      setTemasProhibidos([]);
      setFormatosSugeridos([]);
      setTendencias([]);
      setHashtags([]);
    }
  }, [isOpen, initialData, selectedDate]);

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
      // Add pending values if any
      let finalSugeridos = [...temasSugeridos];
      if (pendingSugerido.trim()) finalSugeridos.push({ text: pendingSugerido.trim(), importance: 'alta' });

      let finalProhibidos = [...temasProhibidos];
      if (pendingProhibido.trim()) finalProhibidos.push({ text: pendingProhibido.trim(), importance: 'alta' });

      let finalFormatos = [...formatosSugeridos];
      if (pendingFormato.trim()) finalFormatos.push({ text: pendingFormato.trim(), importance: 'alta' });

      let finalTendencias = [...tendencias];
      if (pendingTendencia.trim()) finalTendencias.push({ text: pendingTendencia.trim(), importance: 'alta' });

      let finalHashtags = [...hashtags];
      if (pendingHashtag.trim()) finalHashtags.push({ text: pendingHashtag.trim(), importance: 'alta' });

      const upsertData: any = {
        categoria,
        red_social: redSocial,
        fecha: formData.fecha,
        temas_sugeridos: finalSugeridos,
        temas_prohibidos: finalProhibidos,
        formatos_sugeridos: finalFormatos,
        tendencias: finalTendencias,
        hashtags: finalHashtags,
      };

      const { error: upsertError } = await supabase
        .from('content_manager_metrics')
        .upsert(upsertData, { onConflict: 'fecha,categoria,red_social' });

      if (upsertError) throw upsertError;

      setIsOpen(false);
      setTemasSugeridos([]);
      setTemasProhibidos([]);
      setFormatosSugeridos([]);
      setTendencias([]);
      setHashtags([]);
      setPendingSugerido("");
      setPendingProhibido("");
      setPendingFormato("");
      setPendingTendencia("");
      setPendingHashtag("");
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
            <h2 className="text-xl font-black text-[var(--text)]">Content Manager: {redSocial}</h2>
            <p className="text-sm font-medium text-[var(--text-dim)]">Planificación de contenido para {redSocial}</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-white/5 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border-l-4 border-rose-500 rounded-r-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
              <p className="text-sm text-rose-300 font-medium">{error}</p>
            </div>
          )}

          <form id="content-manager-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-5">
              <div className="">
                <label className="block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">Fecha</label>
                <input
                  type="date"
                  name="fecha"
                  required
                  value={formData.fecha}
                  onChange={handleChange}
                  className="w-full glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl px-4 py-3 focus:neon-border focus:outline-none transition-all font-medium"
                />
              </div>

              <div className="border-t border-white/10 pt-6 mt-2 space-y-8">
                <DynamicListInput
                  label="Temas sugeridos"
                  items={temasSugeridos}
                  onChange={setTemasSugeridos}
                  pendingValue={pendingSugerido}
                  setPendingValue={setPendingSugerido}
                />

                <DynamicListInput
                  label="Temas que no se deben hablar"
                  items={temasProhibidos}
                  onChange={setTemasProhibidos}
                  pendingValue={pendingProhibido}
                  setPendingValue={setPendingProhibido}
                />

                <DynamicListInput
                  label="Formatos sugeridos"
                  items={formatosSugeridos}
                  onChange={setFormatosSugeridos}
                  pendingValue={pendingFormato}
                  setPendingValue={setPendingFormato}
                />

                <DynamicListInput
                  label="Tendencia en la red"
                  items={tendencias}
                  onChange={setTendencias}
                  pendingValue={pendingTendencia}
                  setPendingValue={setPendingTendencia}
                />

                <DynamicListInput
                  label="Hashtags"
                  items={hashtags}
                  onChange={setHashtags}
                  pendingValue={pendingHashtag}
                  setPendingValue={setPendingHashtag}
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-white/10 flex items-center justify-end gap-3 mt-auto">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-5 py-2.5 rounded-xl font-bold glass text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
          >
            Cancelar
          </button>
          <button
            form="content-manager-form"
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
