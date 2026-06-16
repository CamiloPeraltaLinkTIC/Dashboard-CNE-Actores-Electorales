"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { formatCOP, formatDate } from "@/lib/campana/format";

interface ImportSummary {
  name: string;
  totalBudget: number;
  durationDays: number;
  startDate: string;
  channels: number;
  days: number;
}

type Status = "idle" | "uploading" | "success" | "error";

export function ImportForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  async function upload(file: File) {
    setStatus("uploading");
    setMessage("");
    setSummary(null);
    setFileName(file.name);

    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch("/api/pauta/import", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(json.error ?? "No se pudo importar el archivo.");
        return;
      }
      setStatus("success");
      setSummary(json.summary as ImportSummary);
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("Error de red. Inténtalo de nuevo.");
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  }

  return (
    <div className="space-y-5">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all ${
          dragging
            ? "border-[var(--accent)] bg-[var(--accent-soft)]"
            : "border-white/20 bg-white/3 hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
        }`}
      >
        <input ref={inputRef} type="file" accept=".xlsx" className="hidden" onChange={onPick} />
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M12 3v12M7 8l5-5 5 5" />
          </svg>
        </div>
        <p className="mt-4 text-sm font-bold text-[var(--text)]">
          {status === "uploading" ? "Procesando archivo…" : "Arrastra tu archivo .xlsx aquí"}
        </p>
        <p className="mt-1 text-xs text-[var(--text-dim)]">o haz clic para seleccionarlo · máximo 5 MB</p>
        {fileName && status !== "idle" && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs text-[var(--text-dim)]">
            📄 {fileName}
          </p>
        )}
      </div>

      {status === "uploading" && (
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-pulse rounded-full accent-bg" />
        </div>
      )}

      {status === "error" && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          <span className="font-bold">No se pudo importar. </span>{message}
        </div>
      )}

      {status === "success" && summary && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4">
          <p className="flex items-center gap-2 text-sm font-bold text-emerald-400">
            <span>✓</span> Importación completada
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <Item label="Pauta" value={summary.name} />
            <Item label="Presupuesto" value={formatCOP(summary.totalBudget)} />
            <Item label="Duración" value={`${summary.durationDays} días`} />
            <Item label="Inicio" value={formatDate(summary.startDate)} />
            <Item label="Canales" value={String(summary.channels)} />
            <Item label="Días cargados" value={String(summary.days)} />
          </dl>
          <a
            href="/pauta"
            className="mt-4 inline-block rounded-xl accent-bg px-4 py-2 text-sm font-bold text-black transition hover:neon-glow"
          >
            Ver dashboard
          </a>
        </div>
      )}
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-emerald-400/70">{label}</dt>
      <dd className="font-semibold text-emerald-300">{value}</dd>
    </div>
  );
}
