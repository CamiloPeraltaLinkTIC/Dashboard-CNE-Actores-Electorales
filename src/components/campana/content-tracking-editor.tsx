"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/context/ToastContext";
import { formatNumber } from "@/lib/campana/format";
import {
  ADS_FIELDS,
  META_FIELDS,
  type ContentTrackingField,
} from "@/lib/campana/types";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string };

type Values = Record<ContentTrackingField, number>;

const LABELS: Record<ContentTrackingField, string> = {
  total_pautados: "Total pautados",
  video: "Video",
  carrusel: "Carrusel",
  pendiente: "Pendiente",
  total_campanas: "Total de campañas",
  campanas_search: "Campañas search",
  campanas_display: "Campañas display",
  total_anuncios: "Total de anuncios",
  piezas_entregadas: "Total de piezas entregadas",
  pauta_pendiente: "Pauta pendiente",
};

interface Props {
  campaignId: string;
  canEdit: boolean;
  initialValues: Values;
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
}

export function ContentTrackingEditor({ campaignId, canEdit, initialValues, action }: Props) {
  const { toast } = useToast();
  const [state, formAction] = useActionState(action, null);

  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Values>(initialValues);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast({ kind: "success", title: state.message });
      setEditing(false);
    } else {
      toast({ kind: "error", title: state.error });
    }
  }, [state, toast]);

  const setField = (f: ContentTrackingField, v: number) =>
    setValues((s) => ({ ...s, [f]: v }));

  const cancel = () => {
    setValues(initialValues);
    setEditing(false);
  };

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="campaign_id" value={campaignId} />

      {/* Barra de acciones */}
      {canEdit && (
        <div className="flex items-center justify-end gap-3">
          {editing ? (
            <>
              <button
                type="button"
                onClick={cancel}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold text-[var(--text-dim)] transition hover:bg-white/10"
              >
                Cancelar
              </button>
              <SaveButton />
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-xl accent-bg px-4 py-2.5 text-sm font-bold text-black shadow-sm transition hover:neon-glow"
            >
              Editar datos
            </button>
          )}
        </div>
      )}

      {/* Cards · Meta */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text-dim)]">Meta</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {META_FIELDS.map((f) => (
            <StatCard
              key={f}
              name={f}
              label={LABELS[f]}
              value={values[f]}
              editing={editing}
              accent={f === "total_pautados"}
              onChange={(v) => setField(f, v)}
            />
          ))}
        </div>
      </section>

      {/* Cards · Ads */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text-dim)]">Ads</h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {ADS_FIELDS.map((f) => (
            <StatCard
              key={f}
              name={f}
              label={LABELS[f]}
              value={values[f]}
              editing={editing}
              accent={f === "total_campanas"}
              onChange={(v) => setField(f, v)}
            />
          ))}
        </div>
      </section>
    </form>
  );
}

function StatCard({
  name,
  label,
  value,
  editing,
  accent = false,
  onChange,
}: {
  name: string;
  label: string;
  value: number;
  editing: boolean;
  accent?: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className="glass p-5" style={accent ? { borderTopColor: "var(--accent)", borderTopWidth: 3 } : undefined}>
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-dim)]">{label}</p>
      {editing ? (
        <input
          name={name}
          type="number"
          min={0}
          step={1}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
          className="mt-2 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-3xl font-black tabular-nums outline-none transition focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
          style={{ color: accent ? "var(--accent)" : "var(--text)" }}
        />
      ) : (
        <>
          <input type="hidden" name={name} value={value} />
          <p
            className="mt-2 text-3xl font-black tabular-nums"
            style={{ color: accent ? "var(--accent)" : "var(--text)" }}
          >
            {formatNumber(value)}
          </p>
        </>
      )}
    </div>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl accent-bg px-4 py-2.5 text-sm font-bold text-black shadow-sm transition hover:neon-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Guardando…" : "Guardar cambios"}
    </button>
  );
}
