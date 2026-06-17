"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  RefreshCw,
  Loader2,
  AlertTriangle,
  Users,
  FileText,
  Eye,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface Account {
  id: string;
  network: string;
  rawType: string;
  username: string;
  avatarUrl: string;
  socialNetworkId: string;
  fill: string;
  followers: number | null;
  posts: number | null;
  views: number | null;
  newFollowers: number | null;
  newPosts: number | null;
  available: boolean;
}

const fmt = (n: number | null) => (n == null ? "—" : n.toLocaleString("es-CO"));

function Avatar({ url, network, fill }: { url: string; network: string; fill: string }) {
  const [failed, setFailed] = useState(false);
  const src = url ? `/api/hootsuite/avatar?u=${encodeURIComponent(url)}` : "";
  if (!src || failed) {
    return (
      <div
        className="h-12 w-12 flex-shrink-0 rounded-xl flex items-center justify-center text-lg font-black text-black"
        style={{ background: fill }}
      >
        {network.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={network}
      onError={() => setFailed(true)}
      className="h-12 w-12 flex-shrink-0 rounded-xl object-cover bg-white/5 border border-white/10"
    />
  );
}

function Delta({ value }: { value: number | null }) {
  if (value == null || value === 0) return null;
  const up = value > 0;
  return (
    <span
      className={`ml-1 inline-flex items-center gap-0.5 text-xs font-bold ${up ? "text-emerald-300" : "text-rose-300"}`}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {up ? "+" : ""}
      {fmt(value)}
    </span>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  delta,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | null;
  delta?: number | null;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-faint)]">
        <Icon className="h-3 w-3" /> {label}
      </p>
      <p className="text-lg font-black text-[var(--text)] tabular-nums">
        {fmt(value)}
        {delta !== undefined && <Delta value={delta ?? null} />}
      </p>
    </div>
  );
}

export function SocialMetricsView({ account = "cne" }: { account?: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/social/metrics?account=${account}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "No se pudieron obtener las métricas.");
      setAccounts(json.accounts);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    load();
  }, [load]);

  const groups = useMemo(() => {
    const map = new Map<string, Account[]>();
    for (const a of accounts) {
      const arr = map.get(a.network) ?? [];
      arr.push(a);
      map.set(a.network, arr);
    }
    return Array.from(map.entries());
  }, [accounts]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-[var(--text)]">Métricas por red · {account.toUpperCase()}</h1>
          <p className="text-[var(--text-dim)] font-medium text-sm">
            Seguidores, publicaciones y vistas por cuenta (con su variación diaria).
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
          <Loader2 className="h-5 w-5 animate-spin" /> Consultando métricas…
        </div>
      ) : error ? (
        <div className="glass border border-amber-500/30 p-6 flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-[var(--text)]">No se pudieron obtener las métricas</h3>
            <p className="mt-1 text-sm text-[var(--text-dim)]">{error}</p>
          </div>
        </div>
      ) : groups.length > 0 ? (
        <div className="space-y-8">
          {groups.map(([network, accs]) => (
            <section key={network} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: accs[0].fill }} />
                <h2 className="text-sm font-black uppercase tracking-widest text-[var(--text-dim)]">
                  {network}
                </h2>
                <span className="text-xs text-[var(--text-faint)]">· {accs.length}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {accs.map((a) => (
                  <div key={a.id} className="glass p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <Avatar url={a.avatarUrl} network={a.network} fill={a.fill} />
                      <div className="min-w-0">
                        <p className="font-bold text-[var(--text)] truncate" title={a.username}>
                          {a.username}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-faint)]">
                          {a.network}
                        </p>
                      </div>
                    </div>

                    {a.available ? (
                      <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-3">
                        <Metric icon={Users} label="Seguidores" value={a.followers} delta={a.newFollowers} />
                        <Metric icon={FileText} label="Publicaciones" value={a.posts} delta={a.newPosts} />
                        {a.views != null && <Metric icon={Eye} label="Vistas" value={a.views} />}
                      </div>
                    ) : (
                      <div className="border-t border-white/10 pt-3">
                        <p className="text-xs text-amber-300/90 font-semibold">Métrica no disponible</p>
                        <p className="text-[11px] text-[var(--text-faint)] mt-0.5">
                          Esta red necesita credenciales de su API para traer datos.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}

          <p className="text-xs text-[var(--text-faint)]">
            Las métricas se traen de la API nativa de cada red (Hootsuite no las expone). Los "nuevos" comparan
            contra el día anterior. Configura las credenciales por red en <code>.env.local</code> para habilitar más.
          </p>
        </div>
      ) : (
        <div className="glass flex flex-col items-center gap-3 py-16 text-[var(--text-dim)]">
          <Users className="h-10 w-10 opacity-20" />
          <p className="font-bold text-sm">No hay cuentas conectadas.</p>
        </div>
      )}
    </div>
  );
}
