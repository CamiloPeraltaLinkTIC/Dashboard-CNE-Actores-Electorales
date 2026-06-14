import React from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { DbStatus } from "@/components/ui/DbStatus";
import type { DbName } from "@/lib/supabase";

/**
 * Andamiaje común para cada módulo migrado. Muestra cabecera, verifica la
 * conexión a la base de datos correcta (registry) y aloja el contenido real.
 */
export function ModuleScaffold({
  title,
  description,
  icon,
  db,
  table,
  source,
  children,
}: {
  title: string;
  description?: string;
  icon?: string;
  db: DbName;
  table?: string;
  /** Carpeta original de la que proviene este módulo (referencia de migración). */
  source?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        icon={icon}
        actions={<DbStatus db={db} table={table} />}
      />

      {children ?? (
        <GlassPanel className="grid-overlay flex min-h-[320px] flex-col items-center justify-center text-center">
          <p className="text-sm font-bold uppercase tracking-widest neon-text">
            Módulo conectado
          </p>
          <p className="mt-2 max-w-md text-sm text-[var(--text-dim)]">
            La estructura, autenticación y fuente de datos están listas. El contenido
            de las vistas se porta en la Fase 2 desde{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-[var(--accent)]">
              {source ?? "el dashboard original"}
            </code>
            .
          </p>
        </GlassPanel>
      )}
    </div>
  );
}
