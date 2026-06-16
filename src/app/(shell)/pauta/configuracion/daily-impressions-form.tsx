"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/context/ToastContext";
import { saveDailyImpressionsAction } from "@/app/(shell)/pauta/actions";
import { CHANNELS } from "@/lib/campana/constants";
import { formatDate } from "@/lib/campana/format";
import type { DailyImpressions, DailyPlan } from "@/lib/campana/types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg px-4 py-2 text-sm font-semibold text-black transition accent-bg hover:neon-glow disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Guardando…" : "Guardar impresiones"}
    </button>
  );
}

interface Props {
  campaignId: string;
  days: DailyPlan[];
  impressions: DailyImpressions[];
}

export function DailyImpressionsForm({ campaignId, days, impressions }: Props) {
  const { toast } = useToast();
  const [state, formAction] = useActionState(saveDailyImpressionsAction, null);

  useEffect(() => {
    if (!state) return;
    state.ok
      ? toast({ kind: "success", title: state.message })
      : toast({ kind: "error", title: state.error });
  }, [state, toast]);

  const impMap = new Map(impressions.map((r) => [r.day_number, r]));
  const channels = [
    { key: "meta" as const, label: CHANNELS.meta.label, color: CHANNELS.meta.color },
    { key: "pilas" as const, label: CHANNELS.pilas.label, color: CHANNELS.pilas.color },
    { key: "youtube" as const, label: CHANNELS.youtube.label, color: CHANNELS.youtube.color },
    { key: "google_display" as const, label: CHANNELS.google_display.label, color: CHANNELS.google_display.color },
  ];

  return (
    <form action={formAction}>
      <input type="hidden" name="campaign_id" value={campaignId} />
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-white/8 bg-white/3 text-left text-xs uppercase tracking-wide text-[var(--text-faint)]">
              <th className="px-4 py-3 font-medium">Día</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              {channels.map((ch) => (
                <th key={ch.key} className="px-3 py-3 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ch.color }} />
                    {ch.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => {
              const row = impMap.get(day.day_number);
              return (
                <tr key={day.day_number} className="border-b border-white/5 transition-colors hover:bg-white/3">
                  <td className="px-4 py-2 font-medium text-[var(--text)]">{day.day_number}</td>
                  <td className="px-4 py-2 text-[var(--text-dim)]">
                    {formatDate(day.date)}
                    <input type="hidden" name={`date_${day.day_number}`} value={day.date} />
                  </td>
                  {channels.map((ch) => (
                    <td key={ch.key} className="px-3 py-2">
                      <input
                        type="number"
                        name={`${ch.key}_${day.day_number}`}
                        defaultValue={row?.[ch.key] || ""}
                        min={0}
                        step="any"
                        placeholder="0"
                        className="w-full min-w-[100px] rounded-md border border-white/15 bg-white/5 px-2.5 py-1.5 text-right text-sm tabular-nums text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-[var(--text-faint)]">Número de impresiones reales por canal y por día.</p>
        <SubmitButton />
      </div>
    </form>
  );
}
