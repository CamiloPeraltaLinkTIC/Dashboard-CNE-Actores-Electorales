"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { getDb } from "@/lib/supabase";
import { X, Save, Plus, AlertCircle, Loader2, Upload } from "lucide-react";
import { useLayout } from "@/context/LayoutContext";

const supabase = getDb("estrategia");

interface ListeningFormProps {
  categoria: string;
  onSuccess: () => void;
  initialData?: any;
  selectedDate?: string;
  isMonthly?: boolean;
}

function DynamicListInput({ label, items, onChange }: { label: string, items: { text: string, importance: string }[], onChange: (items: { text: string, importance: string }[]) => void }) {
  const [text, setText] = useState("");
  const [importance, setImportance] = useState("alta");

  const handleAdd = () => {
    if (!text.trim()) return;
    onChange([...items, { text: text.trim(), importance }]);
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
          value={text}
          onChange={e => setText(e.target.value)}
          className="flex-1 glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl px-4 py-3 focus:neon-border focus:outline-none transition-all font-medium"
          placeholder="Ej. #elecciones"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
        />
        <select
          value={importance}
          onChange={e => setImportance(e.target.value)}
          className="glass text-[var(--text)] rounded-xl px-4 py-3 focus:neon-border focus:outline-none transition-all font-medium"
        >
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
        <button
          type="button"
          onClick={handleAdd}
          className="accent-bg text-black px-4 py-3 rounded-xl font-bold hover:neon-glow transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-col gap-2 mt-3 p-4 glass rounded-xl">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between glass p-2.5 rounded-lg">
              <span className="text-sm font-bold text-[var(--text)]">{item.text}</span>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${
                  item.importance === 'alta' ? "bg-rose-500/10 text-rose-300" :
                  item.importance === 'media' ? "bg-amber-500/10 text-amber-300" :
                  "bg-white/10 text-[var(--text-dim)]"
                }`}>
                  {item.importance}
                </span>
                <button type="button" onClick={() => handleRemove(idx)} className="text-[var(--text-dim)] hover:text-rose-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DynamicImpactInput({ label, idLabel, idPlaceholder, items, onChange }: { label: string, idLabel: string, idPlaceholder: string, items: { nombre: string, identificador: string, impacto: string }[], onChange: (items: { nombre: string, identificador: string, impacto: string }[]) => void }) {
  const [nombre, setNombre] = useState("");
  const [identificador, setIdentificador] = useState("");
  const [impacto, setImpacto] = useState("positivo");

  const handleAdd = () => {
    if (!nombre.trim() || !identificador.trim()) return;
    onChange([...items, { nombre: nombre.trim(), identificador: identificador.trim(), impacto }]);
    setNombre("");
    setIdentificador("");
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="col-span-1 sm:col-span-2 space-y-2 mt-4 pt-4 border-t border-white/10">
      <label className="block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">{label}</label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
          className="flex-1 glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl px-4 py-3 focus:neon-border focus:outline-none transition-all font-medium"
          placeholder="Nombre"
        />
        <input
          type="text"
          value={identificador}
          onChange={e => setIdentificador(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
          className="flex-1 glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl px-4 py-3 focus:neon-border focus:outline-none transition-all font-medium"
          placeholder={idPlaceholder}
        />
        <select
          value={impacto}
          onChange={e => setImpacto(e.target.value)}
          className="glass text-[var(--text)] rounded-xl px-4 py-3 focus:neon-border focus:outline-none transition-all font-medium"
        >
          <option value="positivo">Positivo 😀</option>
          <option value="neutral">Neutral 😐</option>
          <option value="negativo">Negativo 😡</option>
        </select>
        <button
          type="button"
          onClick={handleAdd}
          className="accent-bg text-black px-4 py-3 rounded-xl font-bold hover:neon-glow transition-colors"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-col gap-2 mt-3 p-4 glass rounded-xl">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between glass p-2.5 rounded-lg">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[var(--text)]">{item.nombre}</span>
                <span className="text-xs text-[var(--text-dim)]">{item.identificador}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl" title={item.impacto}>
                  {item.impacto === 'positivo' ? "😀" : item.impacto === 'negativo' ? "😡" : "😐"}
                </span>
                <button type="button" onClick={() => handleRemove(idx)} className="text-[var(--text-dim)] hover:text-rose-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ListeningForm({ categoria, onSuccess, initialData, selectedDate, isMonthly = false }: ListeningFormProps) {
  const { userRole } = useLayout();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activityPeakFile, setActivityPeakFile] = useState<File | null>(null);
  const [hashtagsFile, setHashtagsFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    fecha: selectedDate || (isMonthly ? format(new Date(), 'yyyy-MM-01') : format(new Date(), 'yyyy-MM-dd')),
    resultados: "",
    interacciones: "",
    alcance_potencial: "",
    sentimiento_positivo: "",
    sentimiento_negativo: "",
  });

  const [hashtagsParaUsar, setHashtagsParaUsar] = useState<{ text: string, importance: string }[]>([]);
  const [palabrasClavesParaUsar, setPalabrasClavesParaUsar] = useState<{ text: string, importance: string }[]>([]);
  const [queNoUsar, setQueNoUsar] = useState<{ text: string, importance: string }[]>([]);

  const [cuentasImpacto, setCuentasImpacto] = useState<{ nombre: string, identificador: string, impacto: string }[]>([]);
  const [sitiosImpacto, setSitiosImpacto] = useState<{ nombre: string, identificador: string, impacto: string }[]>([]);

  const initialCuotaEmocion = {
    Ira: { resultados: "", porcentaje: "", tendencia: "igual" },
    Alegria: { resultados: "", porcentaje: "", tendencia: "igual" },
    Tristeza: { resultados: "", porcentaje: "", tendencia: "igual" },
    Miedo: { resultados: "", porcentaje: "", tendencia: "igual" },
    Amor: { resultados: "", porcentaje: "", tendencia: "igual" },
    Sorpresa: { resultados: "", porcentaje: "", tendencia: "igual" },
  };

  const [cuotaEmocion, setCuotaEmocion] = useState(initialCuotaEmocion);

  React.useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        fecha: initialData.fecha,
        resultados: initialData.resultados || "",
        interacciones: initialData.interacciones || "",
        alcance_potencial: initialData.alcance_potencial || "",
        sentimiento_positivo: initialData.sentimiento_positivo !== undefined ? String(initialData.sentimiento_positivo) : "",
        sentimiento_negativo: initialData.sentimiento_negativo !== undefined ? String(initialData.sentimiento_negativo) : "",
      });
      setHashtagsParaUsar(initialData.hashtags_para_usar || []);
      setPalabrasClavesParaUsar(initialData.palabras_claves_para_usar || []);
      setQueNoUsar(initialData.que_no_usar || []);
      setCuentasImpacto(initialData.cuentas_impacto || []);
      setSitiosImpacto(initialData.sitios_impacto || []);

      if (initialData.cuota_emocion) {
        setCuotaEmocion({
          Ira: {
            resultados: initialData.cuota_emocion.Ira?.resultados || "",
            porcentaje: initialData.cuota_emocion.Ira?.porcentaje !== undefined ? String(initialData.cuota_emocion.Ira.porcentaje) : "",
            tendencia: initialData.cuota_emocion.Ira?.tendencia || "igual"
          },
          Alegria: {
            resultados: initialData.cuota_emocion.Alegria?.resultados || "",
            porcentaje: initialData.cuota_emocion.Alegria?.porcentaje !== undefined ? String(initialData.cuota_emocion.Alegria.porcentaje) : "",
            tendencia: initialData.cuota_emocion.Alegria?.tendencia || "igual"
          },
          Tristeza: {
            resultados: initialData.cuota_emocion.Tristeza?.resultados || "",
            porcentaje: initialData.cuota_emocion.Tristeza?.porcentaje !== undefined ? String(initialData.cuota_emocion.Tristeza.porcentaje) : "",
            tendencia: initialData.cuota_emocion.Tristeza?.tendencia || "igual"
          },
          Miedo: {
            resultados: initialData.cuota_emocion.Miedo?.resultados || "",
            porcentaje: initialData.cuota_emocion.Miedo?.porcentaje !== undefined ? String(initialData.cuota_emocion.Miedo.porcentaje) : "",
            tendencia: initialData.cuota_emocion.Miedo?.tendencia || "igual"
          },
          Amor: {
            resultados: initialData.cuota_emocion.Amor?.resultados || "",
            porcentaje: initialData.cuota_emocion.Amor?.porcentaje !== undefined ? String(initialData.cuota_emocion.Amor.porcentaje) : "",
            tendencia: initialData.cuota_emocion.Amor?.tendencia || "igual"
          },
          Sorpresa: {
            resultados: initialData.cuota_emocion.Sorpresa?.resultados || "",
            porcentaje: initialData.cuota_emocion.Sorpresa?.porcentaje !== undefined ? String(initialData.cuota_emocion.Sorpresa.porcentaje) : "",
            tendencia: initialData.cuota_emocion.Sorpresa?.tendencia || "igual"
          },
        });
      } else {
        setCuotaEmocion(initialCuotaEmocion);
      }
    } else if (isOpen && !initialData) {
      setFormData({
        fecha: selectedDate || (isMonthly ? format(new Date(), 'yyyy-MM-01') : format(new Date(), 'yyyy-MM-dd')),
        resultados: "",
        interacciones: "",
        alcance_potencial: "",
        sentimiento_positivo: "",
        sentimiento_negativo: "",
      });
      setCuotaEmocion(initialCuotaEmocion);
    }
  }, [isOpen, initialData, selectedDate, isMonthly]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `listening-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('dashboard_images')
      .upload(fileName, file);

    if (uploadError) {
      console.error("Upload error details:", uploadError);
      throw new Error("Error al subir imagen. Asegúrate de tener el bucket 'dashboard_images' como público.");
    }

    const { data: { publicUrl } } = supabase.storage
      .from('dashboard_images')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'viewer') return;
    setIsLoading(true);
    setError("");

    try {
      let activityPeakUrl = null;
      if (activityPeakFile) {
        activityPeakUrl = await uploadImage(activityPeakFile);
      }

      let hashtagsUrl = null;
      if (hashtagsFile) {
        hashtagsUrl = await uploadImage(hashtagsFile);
      }

      const cuotaEmocionPayload: any = {};
      Object.entries(cuotaEmocion).forEach(([emotion, val]) => {
        cuotaEmocionPayload[emotion] = {
          resultados: val.resultados,
          porcentaje: val.porcentaje !== "" ? Number(val.porcentaje) : 0,
          tendencia: val.tendencia
        };
      });

      const upsertData: any = {
        categoria,
        fecha: formData.fecha,
        resultados: formData.resultados,
        interacciones: formData.interacciones,
        alcance_potencial: formData.alcance_potencial,
        sentimiento_positivo: formData.sentimiento_positivo !== "" ? Number(formData.sentimiento_positivo) : 0,
        sentimiento_negativo: formData.sentimiento_negativo !== "" ? Number(formData.sentimiento_negativo) : 0,
        hashtags_para_usar: hashtagsParaUsar,
        palabras_claves_para_usar: palabrasClavesParaUsar,
        que_no_usar: queNoUsar,
        cuentas_impacto: cuentasImpacto,
        sitios_impacto: sitiosImpacto,
        cuota_emocion: cuotaEmocionPayload
      };
      if (activityPeakUrl) upsertData.activity_peak = activityPeakUrl;
      if (hashtagsUrl) upsertData.hashtags = hashtagsUrl;

      const { error: upsertError } = await supabase
        .from('listening_metrics')
        .upsert(upsertData, { onConflict: 'fecha,categoria' });

      if (upsertError) throw upsertError;

      setIsOpen(false);
      setActivityPeakFile(null);
      setHashtagsFile(null);
      setHashtagsParaUsar([]);
      setPalabrasClavesParaUsar([]);
      setQueNoUsar([]);
      setCuentasImpacto([]);
      setSitiosImpacto([]);
      setCuotaEmocion(initialCuotaEmocion);
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
        className="flex items-center gap-2 accent-bg text-black px-4 py-2.5 rounded-xl font-bold hover:neon-glow transition-colors"
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
            <h2 className="text-xl font-black text-[var(--text)]">Actualizar Listening</h2>
            <p className="text-sm font-medium text-[var(--text-dim)]">Métricas diarias</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-white/10 rounded-xl transition-colors"
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

          <form id="listening-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">Fecha</label>
                <input
                  type={isMonthly ? "month" : "date"}
                  name="fecha"
                  required
                  value={isMonthly && formData.fecha ? formData.fecha.substring(0, 7) : formData.fecha}
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

              <div>
                <label className="block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">Resultados</label>
                <input
                  type="text"
                  name="resultados"
                  required
                  value={formData.resultados}
                  onChange={handleChange}
                  className="w-full glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl px-4 py-3 focus:neon-border focus:outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">Interacciones</label>
                <input
                  type="text"
                  name="interacciones"
                  required
                  value={formData.interacciones}
                  onChange={handleChange}
                  className="w-full glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl px-4 py-3 focus:neon-border focus:outline-none transition-all font-medium"
                />
              </div>

              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">Alcance Potencial</label>
                <input
                  type="text"
                  name="alcance_potencial"
                  required
                  value={formData.alcance_potencial}
                  onChange={handleChange}
                  className="w-full glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl px-4 py-3 focus:neon-border focus:outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">Sentimiento Positivo (%)</label>
                <input
                  type="text"
                  name="sentimiento_positivo"
                  required
                  value={formData.sentimiento_positivo}
                  onChange={handleChange}
                  className="w-full glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl px-4 py-3 focus:neon-border focus:outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">Sentimiento Negativo (%)</label>
                <input
                  type="text"
                  name="sentimiento_negativo"
                  required
                  value={formData.sentimiento_negativo}
                  onChange={handleChange}
                  className="w-full glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl px-4 py-3 focus:neon-border focus:outline-none transition-all font-medium"
                />
              </div>

              <div className="col-span-1 sm:col-span-2 border-t border-white/10 pt-4">
                <h4 className="text-sm font-black text-[var(--text)] mb-3 uppercase tracking-wider">Cuota de Emoción</h4>
                <div className="space-y-4 glass p-4 rounded-2xl">
                  {Object.entries(cuotaEmocion).map(([emocion, val]) => (
                    <div key={emocion} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                      <div className="sm:col-span-3 flex items-center gap-2">
                        <span className="text-lg">
                          {emocion === "Ira" ? "😡" :
                           emocion === "Alegria" ? "😀" :
                           emocion === "Tristeza" ? "😢" :
                           emocion === "Miedo" ? "😨" :
                           emocion === "Amor" ? "😍" : "😮"}
                        </span>
                        <span className="text-sm font-bold text-[var(--text)]">{emocion === "Alegria" ? "Alegría" : emocion === "Sorpresa" ? "Sorpresa" : emocion}</span>
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block sm:hidden text-[10px] font-bold text-[var(--text-dim)] uppercase mb-1">Resultados</label>
                        <input
                          type="text"
                          placeholder="Resultados (ej. 1.2K)"
                          value={val.resultados}
                          onChange={(e) => {
                            setCuotaEmocion(prev => ({
                              ...prev,
                              [emocion]: { ...prev[emocion as keyof typeof cuotaEmocion], resultados: e.target.value }
                            }));
                          }}
                          className="w-full glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl px-3 py-2 text-sm focus:neon-border focus:outline-none transition-all font-medium"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block sm:hidden text-[10px] font-bold text-[var(--text-dim)] uppercase mb-1">Porcentaje</label>
                        <input
                          type="number"
                          placeholder="Porcentaje %"
                          value={val.porcentaje}
                          onChange={(e) => {
                            setCuotaEmocion(prev => ({
                              ...prev,
                              [emocion]: { ...prev[emocion as keyof typeof cuotaEmocion], porcentaje: e.target.value }
                            }));
                          }}
                          className="w-full glass text-[var(--text)] placeholder:text-[var(--text-faint)] rounded-xl px-3 py-2 text-sm focus:neon-border focus:outline-none transition-all font-medium"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block sm:hidden text-[10px] font-bold text-[var(--text-dim)] uppercase mb-1">Tendencia</label>
                        <select
                          value={val.tendencia}
                          onChange={(e) => {
                            setCuotaEmocion(prev => ({
                              ...prev,
                              [emocion]: { ...prev[emocion as keyof typeof cuotaEmocion], tendencia: e.target.value }
                            }));
                          }}
                          className="w-full glass text-[var(--text)] rounded-xl px-3 py-2 text-sm focus:neon-border focus:outline-none transition-all font-medium font-semibold"
                        >
                          <option value="igual">Sin cambio ▬</option>
                          <option value="subio">Incrementó ▲</option>
                          <option value="bajo">Disminuyó ▼</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">Activity Peak (Imagen)</label>
                <div className="relative w-full glass text-[var(--text)] rounded-xl px-4 py-3 focus-within:neon-border transition-all font-medium flex items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setActivityPeakFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex items-center gap-2 pointer-events-none">
                    <Upload className="w-5 h-5 text-[var(--text-dim)]" />
                    <span className="text-sm text-[var(--text-dim)]">
                      {activityPeakFile ? activityPeakFile.name : "Seleccionar imagen para Activity Peak..."}
                    </span>
                  </div>
                </div>
              </div>

              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">Hashtags (Imagen)</label>
                <div className="relative w-full glass text-[var(--text)] rounded-xl px-4 py-3 focus-within:neon-border transition-all font-medium flex items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setHashtagsFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex items-center gap-2 pointer-events-none">
                    <Upload className="w-5 h-5 text-[var(--text-dim)]" />
                    <span className="text-sm text-[var(--text-dim)]">
                      {hashtagsFile ? hashtagsFile.name : "Seleccionar imagen para Hashtags..."}
                    </span>
                  </div>
                </div>
              </div>

              <DynamicListInput
                label="Hashtags para usar"
                items={hashtagsParaUsar}
                onChange={setHashtagsParaUsar}
              />

              <DynamicListInput
                label="Palabras Claves para usar"
                items={palabrasClavesParaUsar}
                onChange={setPalabrasClavesParaUsar}
              />

              <DynamicListInput
                label="Qué NO usar"
                items={queNoUsar}
                onChange={setQueNoUsar}
              />

              <DynamicImpactInput
                label="Cuentas con Mayor Impacto"
                idLabel="Arroba (@)"
                idPlaceholder="Ej. @usuario"
                items={cuentasImpacto}
                onChange={setCuentasImpacto}
              />

              <DynamicImpactInput
                label="Sitios con Mayor Impacto"
                idLabel="URL"
                idPlaceholder="Ej. https://ejemplo.com"
                items={sitiosImpacto}
                onChange={setSitiosImpacto}
              />

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
            form="listening-form"
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2.5 accent-bg text-black rounded-xl font-bold hover:neon-glow transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Guardar Datos
          </button>
        </div>
      </div>
    </div>
  );
}
