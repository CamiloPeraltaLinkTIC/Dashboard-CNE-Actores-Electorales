"use client";

import { useFormStatus } from "react-dom";
import { CHANNELS } from "@/lib/campana/constants";
import { formatCOP, formatPercent } from "@/lib/campana/format";
import type { ChannelKey } from "@/lib/campana/types";
import { updateRealInvestmentAction } from "@/app/(shell)/pauta/actions";

export interface TrackingRow {
  channelId: string;
  channel: ChannelKey;
  planned: number;
  real: number;
  difference: number;
  executionPct: number;
}

function RowSaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[var(--text-dim)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
    >
      {pending ? "…" : "Guardar"}
    </button>
  );
}

export function TrackingTable({
  rows,
  totals,
}: {
  rows: TrackingRow[];
  totals: { planned: number; real: number; difference: number; executionPct: number };
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-sm">
        <thead>
          <tr className="border-b border-white/8 text-left text-xs uppercase tracking-wider text-[var(--text-faint)]">
            <th className="px-4 py-3 font-bold">Canal</th>
            <th className="px-4 py-3 text-right font-bold">Inversión Meta</th>
            <th className="px-4 py-3 text-right font-bold">Inversión Real</th>
            <th className="px-4 py-3 text-right font-bold">Diferencia</th>
            <th className="px-4 py-3 text-right font-bold">% Ejecución</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const meta = CHANNELS[row.channel];
            return (
              <tr key={row.channelId} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
                    <span className="font-semibold text-[var(--text)]">{meta.label}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-[var(--text-dim)]">
                  {formatCOP(row.planned)}
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={updateRealInvestmentAction} className="flex items-center justify-end gap-2">
                    <input type="hidden" name="channel_id" value={row.channelId} />
                    <input
                      type="number"
                      name="real_investment"
                      defaultValue={row.real || ""}
                      min={0}
                      step="any"
                      placeholder="0"
                      className="w-32 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-right text-sm tabular-nums text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]"
                    />
                    <RowSaveButton />
                  </form>
                </td>
                <td className={`px-4 py-3 text-right tabular-nums font-semibold ${row.difference < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                  {formatCOP(row.difference)}
                </td>
                <td className="px-4 py-3 text-right">
                  <ExecutionBadge pct={row.executionPct} />
                </td>
                <td />
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-white/15 font-bold text-[var(--text)]">
            <td className="px-4 py-3">Total pauta</td>
            <td className="px-4 py-3 text-right tabular-nums">{formatCOP(totals.planned)}</td>
            <td className="px-4 py-3 text-right tabular-nums">{formatCOP(totals.real)}</td>
            <td className={`px-4 py-3 text-right tabular-nums ${totals.difference < 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {formatCOP(totals.difference)}
            </td>
            <td className="px-4 py-3 text-right">{formatPercent(totals.executionPct, 0)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function ExecutionBadge({ pct }: { pct: number }) {
  const value = Math.round(pct * 100);
  const style =
    value === 0
      ? { bg: "rgba(100,116,139,0.15)", text: "#64748b" }
      : value < 90
        ? { bg: "rgba(245,158,11,0.15)",  text: "#f59e0b" }
        : value <= 110
          ? { bg: "rgba(16,185,129,0.15)", text: "#10b981" }
          : { bg: "rgba(244,63,94,0.15)",  text: "#f43f5e" };
  return (
    <span
      className="inline-block rounded-full px-2.5 py-1 text-xs font-bold tabular-nums"
      style={{ background: style.bg, color: style.text }}
    >
      {value}%
    </span>
  );
}
