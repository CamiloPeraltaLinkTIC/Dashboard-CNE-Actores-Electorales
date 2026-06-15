"use client";

import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { getDb } from "@/lib/supabase";

interface ContentItem {
  id: string;
  time: string;
  platform: "facebook" | "instagram" | "tiktok" | "x";
  type: string;
  description: string;
  status: string;
  duration: number;
  url?: string;
  comments?: string;
  kpi?: string;
  viewer_comments: [];
}

// Convierte cualquier formato de hora a "HH:MM" (24h):
//  - Número fraccionario de Excel (0 < n < 1): "07:00", "15:30", etc.
//  - String "8:00 AM" / "3:30 PM" / "09:25 am"
//  - String rango "06:00 a 7:00" / "11:00 a 11:10" → primera hora
function parseTime(raw: any): string | null {
  if (raw == null) return null;

  // Valor numérico de Excel: fracción del día (ej. 7/24 = 0.2916 para 07:00)
  if (typeof raw === "number" && raw > 0 && raw < 1) {
    const totalMinutes = Math.round(raw * 24 * 60);
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  const str = String(raw).trim();

  // AM/PM primero para evitar que el regex de rango capture "3:30" de "3:30 PM"
  const ampmMatch = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const m = parseInt(ampmMatch[2], 10);
    const period = ampmMatch[3].toUpperCase();
    if (period === "AM" && h === 12) h = 0;
    if (period === "PM" && h !== 12) h += 12;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  // Rango "06:00 a 7:00" / "11:00 a 11:10" → toma la primera hora
  const rangeMatch = str.match(/^(\d{1,2}:\d{2})/);
  if (rangeMatch) {
    const [h, m] = rangeMatch[1].split(":").map(Number);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  return null;
}

const TYPE_MAP: Record<string, string> = {
  reel: "reel",
  post: "post",
  story: "Story",
  "trino + imagen": "Trino + imagen",
  "trino más imagen": "Trino + imagen",
  trino: "Trino",
  entrecomillados: "entrecomillados",
  "espacio reservado": "Espacio reservado",
};

function parseType(raw: string | null | undefined, description: string | null | undefined): string {
  if (!raw && description?.toUpperCase().includes("ESPACIO RESERVADO")) return "Espacio reservado";
  if (!raw) return "post";
  const key = String(raw).toLowerCase().trim();
  return TYPE_MAP[key] ?? "post";
}

function parseSheet(ws: XLSX.WorkSheet): ContentItem[] {
  const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null });

  const platforms: Array<{ id: ContentItem["platform"]; offset: number }> = [
    { id: "facebook", offset: 0 },
    { id: "instagram", offset: 4 },
    { id: "tiktok", offset: 8 },
    { id: "x", offset: 12 },
  ];

  const items: ContentItem[] = [];

  for (let r = 5; r < data.length; r++) {
    const row = data[r] as any[];
    if (!row || row.every((c) => c == null)) continue;

    for (const plat of platforms) {
      const rawTime = row[plat.offset];
      const rawType = row[plat.offset + 1];
      const rawDesc = row[plat.offset + 2];

      const time = parseTime(rawTime);
      if (!time) continue;

      const description = rawDesc ? String(rawDesc).trim() : "";
      const type = parseType(rawType, description);

      items.push({
        id: `${Date.now()}-${r}-${plat.id}`,
        time,
        platform: plat.id,
        type,
        description,
        status: "Por crear contenido",
        duration: 10,
        viewer_comments: [],
      });
    }
  }

  return items;
}

type Step = "idle" | "select-sheet" | "preview";

interface Props {
  table: string;
  onImported: (items: any[]) => void;
}

export function ParrillaExcelImport({ table, onImported }: Props) {
  const supabase = getDb("analytics");
  const inputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("idle");
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [preview, setPreview] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep("idle");
    setWorkbook(null);
    setSelectedSheet("");
    setPreview([]);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  // Paso 1 — leer el archivo y mostrar selector de hojas
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      setWorkbook(wb);
      setSelectedSheet(wb.SheetNames[0]);
      setStep("select-sheet");
    } catch {
      setError("No se pudo leer el archivo. Asegúrate de que sea un .xlsx válido.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  // Paso 2 — parsear la hoja seleccionada y mostrar preview
  const handleSheetConfirm = () => {
    if (!workbook || !selectedSheet) return;
    const ws = workbook.Sheets[selectedSheet];
    const items = parseSheet(ws);

    if (!items.length) {
      setError("No se encontraron datos válidos en esta hoja.");
      return;
    }

    setPreview(items);
    setStep("preview");
  };

  // Paso 3 — guardar en la BD activa (table prop)
  const handleImport = async () => {
    if (!preview.length) return;
    setSaving(true);
    setError(null);

    try {
      const rows = preview.map((item) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}-${item.platform}`,
        time: item.time,
        platform: item.platform,
        type: item.type,
        description: item.description,
        status: item.status,
        duration: item.duration,
        url: item.url ?? null,
        comments: item.comments ?? null,
        kpi: item.kpi ?? null,
        viewer_comments: [],
      }));

      const { error: dbError } = await supabase.from(table).insert(rows);
      if (dbError) throw dbError;

      onImported(rows.map((r) => ({ ...r, viewerComments: [] })));
      reset();
    } catch (e: any) {
      setError(e.message || "Error al guardar en la base de datos.");
    } finally {
      setSaving(false);
    }
  };

  const byPlatform = Object.entries(
    preview.reduce<Record<string, number>>((acc, item) => {
      acc[item.platform] = (acc[item.platform] ?? 0) + 1;
      return acc;
    }, {})
  );

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFile}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="glass flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold text-[var(--text-dim)] hover:text-[var(--text)] disabled:opacity-50"
        title="Importar desde Excel"
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        {loading ? "Leyendo..." : "Importar Excel"}
      </button>

      {/* ── PASO 1: Selector de hoja ── */}
      {step === "select-sheet" && workbook && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm">
          <div className="glass-strong w-full max-w-md overflow-hidden rounded-2xl">
            <div className="border-b border-white/10 p-6">
              <h2 className="text-base font-extrabold text-[var(--text)]">Selecciona la hoja</h2>
              <p className="mt-1 text-sm text-[var(--text-dim)]">
                El archivo tiene {workbook.SheetNames.length} pestañas. Elige cuál importar a{" "}
                <span className="font-bold text-[var(--accent)]">{table}</span>.
              </p>
            </div>

            <div className="p-6 space-y-2 max-h-72 overflow-y-auto">
              {workbook.SheetNames.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSelectedSheet(name)}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-left transition-all ${
                    selectedSheet === name
                      ? "neon-border text-[var(--text)]"
                      : "glass text-[var(--text-dim)] hover:text-[var(--text)]"
                  }`}
                  style={selectedSheet === name ? { background: "var(--accent-soft)" } : undefined}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0" style={{ color: selectedSheet === name ? "var(--accent)" : undefined }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C6 8.496 5.496 9 4.875 9m1.5-3.75h13.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m0-3.75C18 8.496 18.504 9 19.125 9" />
                  </svg>
                  {name}
                </button>
              ))}
            </div>

            {error && (
              <p className="mx-6 rounded-xl bg-rose-500/15 px-4 py-2.5 text-sm text-rose-300">{error}</p>
            )}

            <div className="flex justify-end gap-3 border-t border-white/10 p-6">
              <button type="button" className="glass rounded-xl px-4 py-2.5 text-sm font-bold text-[var(--text-dim)] hover:text-[var(--text)]" onClick={reset}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSheetConfirm}
                className="rounded-xl accent-bg px-5 py-2.5 text-sm font-bold text-black hover:neon-glow"
              >
                Ver preview →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PASO 2: Preview y confirmación ── */}
      {step === "preview" && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm">
          <div className="glass-strong w-full max-w-lg overflow-hidden rounded-2xl">
            <div className="border-b border-white/10 p-6">
              <h2 className="text-base font-extrabold text-[var(--text)]">Vista previa de importación</h2>
              <p className="mt-1 text-sm text-[var(--text-dim)]">
                Hoja: <span className="font-bold text-[var(--accent)]">{selectedSheet}</span> →{" "}
                tabla <span className="font-bold text-[var(--accent)]">{table}</span>
              </p>
              <p className="mt-0.5 text-sm text-[var(--text-dim)]">
                Se importarán <strong className="text-[var(--text)]">{preview.length}</strong> publicaciones.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {byPlatform.map(([plat, count]) => (
                  <div key={plat} className="glass rounded-xl px-4 py-3 flex justify-between items-center">
                    <span className="text-xs font-bold capitalize text-[var(--text-dim)]">{plat}</span>
                    <span className="text-sm font-extrabold text-[var(--text)]">{count}</span>
                  </div>
                ))}
              </div>

              <div className="max-h-52 overflow-y-auto space-y-2">
                {preview.slice(0, 8).map((item, i) => (
                  <div key={i} className="glass rounded-xl px-3 py-2 flex items-center gap-3 text-xs">
                    <span className="font-mono text-[var(--accent)] w-12 shrink-0">{item.time}</span>
                    <span className="capitalize text-[var(--text-dim)] w-16 shrink-0">{item.platform}</span>
                    <span className="text-[var(--text-dim)] w-20 shrink-0">{item.type}</span>
                    <span className="text-[var(--text)] truncate">{item.description}</span>
                  </div>
                ))}
                {preview.length > 8 && (
                  <p className="text-center text-xs text-[var(--text-faint)]">…y {preview.length - 8} más</p>
                )}
              </div>

              {error && (
                <p className="rounded-xl bg-rose-500/15 px-4 py-2.5 text-sm text-rose-300">{error}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-white/10 p-6">
              <button type="button" className="glass rounded-xl px-4 py-2.5 text-sm font-bold text-[var(--text-dim)] hover:text-[var(--text)]" onClick={() => setStep("select-sheet")}>
                ← Cambiar hoja
              </button>
              <button type="button" className="glass rounded-xl px-4 py-2.5 text-sm font-bold text-[var(--text-dim)] hover:text-[var(--text)]" onClick={reset}>
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleImport}
                className="rounded-xl accent-bg px-5 py-2.5 text-sm font-bold text-black hover:neon-glow disabled:opacity-50"
              >
                {saving ? "Importando..." : `Importar ${preview.length} publicaciones`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
