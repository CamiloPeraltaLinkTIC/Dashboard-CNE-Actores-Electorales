"use client";

import React, { useEffect, useState } from "react";
import { Database, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { getDb, type DbName } from "@/lib/supabase";

const LABELS: Record<DbName, string> = {
  analytics: "DB_ANALYTICS",
  estrategia: "DB_ESTRATEGIA",
  content: "DB_CONTENT",
  campana: "DB_CAMPANA",
};

/**
 * Verifica en vivo que el módulo está conectado a su base de datos correcta
 * usando el registry. Hace un ping ligero (HEAD count sobre una tabla).
 */
export function DbStatus({ db, table }: { db: DbName; table?: string }) {
  const [state, setState] = useState<"loading" | "ok" | "warn">("loading");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const client = getDb(db);
      try {
        if (table) {
          const { error, count } = await client
            .from(table)
            .select("*", { count: "exact", head: true });
          if (!mounted) return;
          if (error) {
            setState("warn");
            setDetail(error.message);
          } else {
            setState("ok");
            setDetail(`${count ?? 0} registros en ${table}`);
          }
        } else {
          // Sin tabla: solo confirmamos que el cliente tiene URL configurada.
          const url = (client as any)?.supabaseUrl ?? "";
          if (!mounted) return;
          setState(url ? "ok" : "warn");
          setDetail(url ? "Cliente configurado" : "Sin URL configurada");
        }
      } catch (e: any) {
        if (!mounted) return;
        setState("warn");
        setDetail(e?.message ?? "Error de conexión");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [db, table]);

  return (
    <div className="glass flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs">
      <Database className="h-4 w-4 text-[var(--text-dim)]" />
      <span className="font-bold text-[var(--text)]">{LABELS[db]}</span>
      {state === "loading" && <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--text-dim)]" />}
      {state === "ok" && (
        <span className="flex items-center gap-1 text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" /> {detail}
        </span>
      )}
      {state === "warn" && (
        <span className="flex items-center gap-1 text-amber-300" title={detail}>
          <AlertTriangle className="h-3.5 w-3.5" /> {detail.slice(0, 40)}
        </span>
      )}
    </div>
  );
}
