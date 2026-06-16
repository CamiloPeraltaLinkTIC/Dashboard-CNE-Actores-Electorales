"use client";

import React, { useEffect, useState, useCallback } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { RefreshCw, Loader2, AlertTriangle, Users } from "lucide-react";

interface NetworkRow {
  name: string;
  followers: number;
  fill: string;
}
interface LiveData {
  total: number;
  networks: NetworkRow[];
  profileCount: number;
}

const fmt = (n: number) => n.toLocaleString("es-CO");

export function HootsuiteLiveView({ account = "cne" }: { account?: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LiveData | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/hootsuite/profiles?account=${account}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "No se pudo conectar con Hootsuite.");
      setData({ total: json.total, networks: json.networks, profileCount: json.profileCount });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--text)]">Seguidores en vivo · Hootsuite</h1>
          <p className="text-[var(--text-dim)] font-medium text-sm">
            Conteo real de seguidores por red social de la cuenta {account.toUpperCase()}.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 glass text-[var(--text-dim)] hover:text-[var(--accent)] px-4 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {loading ? (
        <div className="glass flex items-center justify-center gap-3 py-20 text-[var(--text-dim)]">
          <Loader2 className="h-5 w-5 animate-spin" /> Consultando Hootsuite…
        </div>
      ) : error ? (
        <div className="glass border border-amber-500/30 p-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-[var(--text)]">No se pudo conectar con Hootsuite</h3>
              <p className="mt-1 text-sm text-[var(--text-dim)]">{error}</p>
              <ul className="mt-2 list-disc pl-5 text-xs text-[var(--text-faint)] space-y-1">
                <li>Verifica <code className="text-amber-300">HOOTSUITE_CLIENT_ID</code> y <code className="text-amber-300">HOOTSUITE_CLIENT_SECRET</code> en <code>.env.local</code>.</li>
                <li>
                  Genera/renueva el refresh token visitando{" "}
                  <a href="/api/auth/hootsuite" target="_blank" rel="noreferrer" className="text-[var(--accent)] underline">
                    /api/auth/hootsuite
                  </a>{" "}
                  y pégalo como <code className="text-amber-300">CNE_HOOTSUITE_REFRESH_TOKEN</code>.
                </li>
                <li>Reinicia el servidor tras cambiar variables de entorno.</li>
              </ul>
            </div>
          </div>
        </div>
      ) : data && data.networks.length > 0 ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Total */}
            <div className="glass p-6 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-dim)] uppercase tracking-wider mb-2">
                <Users className="h-4 w-4 text-[var(--accent)]" /> Seguidores totales
              </div>
              <p className="text-4xl font-black text-[var(--text)] tracking-tight">{fmt(data.total)}</p>
              <p className="text-xs text-[var(--text-faint)] mt-2">{data.profileCount} perfiles conectados</p>
            </div>

            {/* Distribución */}
            <div className="glass p-6 lg:col-span-2">
              <h2 className="text-lg font-black text-[var(--text)] mb-4">Distribución por red</h2>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(11, 17, 32, 0.95)",
                        borderColor: "rgba(255,255,255,0.12)",
                        borderRadius: "12px",
                        color: "#e8edf7",
                        fontWeight: 600,
                      }}
                      formatter={(value: unknown, name: unknown) => [fmt(Number(value) || 0), String(name)]}
                    />
                    <Pie
                      data={data.networks}
                      cx="50%"
                      cy="50%"
                      innerRadius="55%"
                      outerRadius="80%"
                      paddingAngle={2}
                      dataKey="followers"
                      nameKey="name"
                      stroke="none"
                      cornerRadius={6}
                    >
                      {data.networks.map((n) => (
                        <Cell key={n.name} fill={n.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detalle por red */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.networks.map((n) => (
              <div key={n.name} className="glass p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ background: n.fill }} />
                  <span className="font-bold text-[var(--text)]">{n.name}</span>
                </div>
                <span className="text-xl font-black text-[var(--text)] tabular-nums">{fmt(n.followers)}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="glass flex flex-col items-center gap-3 py-16 text-[var(--text-dim)]">
          <Users className="h-10 w-10 opacity-20" />
          <p className="font-bold text-sm">Hootsuite no devolvió perfiles con seguidores.</p>
        </div>
      )}
    </div>
  );
}
