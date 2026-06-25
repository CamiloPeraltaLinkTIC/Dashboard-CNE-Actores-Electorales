"use client";

import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { ParrillaView } from "./ParrillaView";
import { ParrillaGenericaView } from "../parrilla-generica/ParrillaGenericaView";
import { PageHeader } from "@/components/ui/PageHeader";
import { DbStatus } from "@/components/ui/DbStatus";
import { TabBar } from "@/components/ui/TabBar";
import { useLayout } from "@/context/LayoutContext";
import { getDb } from "@/lib/supabase";
import type { VerticalId } from "@/lib/verticals";

const supabase = getDb("analytics");

interface Tab {
  key: string;
  label: string;
  node: React.ReactNode;
}

interface CustomTab {
  id: string;
  vertical: string;
  key: string;
  label: string;
  table_name: string;
}

function toSlug(label: string) {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function buildSQL(tableName: string) {
  return `create table public.${tableName} (
  id              text    primary key,
  time            text    not null,
  platform        text    not null,
  type            text    not null,
  description     text    not null default '',
  status          text    not null default 'Programado',
  duration        integer not null default 0,
  url             text,
  comments        text,
  kpi             text,
  viewer_comments jsonb   default '[]'::jsonb,
  content         jsonb
);

alter table public.${tableName} enable row level security;
create policy "select_all" on public.${tableName} for select using (true);
create policy "insert_all" on public.${tableName} for insert with check (true);
create policy "update_all" on public.${tableName} for update using (true);
create policy "delete_all" on public.${tableName} for delete using (true);
alter publication supabase_realtime add table public.${tableName};`;
}

export function ParrillasModule({ vertical }: { vertical: VerticalId }) {
  const { userRole } = useLayout();
  const isAdmin = userRole === "admin";

  const [customTabs, setCustomTabs] = useState<CustomTab[]>([]);
  const initialTabSet = useRef(false);
  const [showModal, setShowModal] = useState(false);
  const [newTabLabel, setNewTabLabel] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CustomTab | null>(null);

  const newTabKey = toSlug(newTabLabel);
  const newTableName = newTabLabel.trim()
    ? `parrilla_${toSlug(newTabLabel)}_${vertical}`
    : "";
  const sql = newTableName ? buildSQL(newTableName) : "";

  const loadCustomTabs = useCallback(async () => {
    const { data } = await supabase
      .from("parrilla_custom_tabs")
      .select("*")
      .eq("vertical", vertical)
      .order("created_at", { ascending: true });
    if (data) {
      setCustomTabs(data);
      if (!initialTabSet.current) {
        initialTabSet.current = true;
        const entrega = data.find((ct) => ct.key.includes("entrega_credencial"));
        if (entrega) setActive(entrega.key);
      }
    }
  }, [vertical]);

  useEffect(() => { loadCustomTabs(); }, [loadCustomTabs]);

  const hardcodedTabs = useMemo<Tab[]>(() => {
    if (vertical === "cne") {
      return [
        {
          key: "presidenciales",
          label: "Presidenciales",
          node: (
            <ParrillaView
              table="parrilla_elecciones_presidenciales_cne"
              title="Parrilla Elecciones Presidenciales · CNE"
            />
          ),
        },
        {
          key: "mision",
          label: "Misión de Observación",
          node: (
            <div>
              <PageHeader
                title="Misión de Observación Internacional · CNE"
                description="Parrilla de contenidos del evento de observación"
                icon="LayoutGrid"
                actions={<DbStatus db="content" table="dashboard_content" />}
              />
              <ParrillaGenericaView />
            </div>
          ),
        },
        {
          key: "foro-juventudes",
          label: "Foro de Juventudes",
          node: (
            <ParrillaView
              table="parrilla_foro_juventudes_cne"
              title="Foro de Juventudes · CNE"
            />
          ),
        },
        {
          key: "democracia-sin-barreras",
          label: "Democracia sin barreras",
          node: (
            <ParrillaView
              table="parrilla_democracia_sin_barreras_cne"
              title="Democracia sin barreras · CNE"
            />
          ),
        },
        {
          key: "moi",
          label: "MOI 2.0",
          node: (
            <ParrillaView
              table="parrilla_moi_cne"
              title="MOI · CNE"
            />
          ),
        },
        {
          key: "votaciones-segunda-vuelta",
          label: "Presidenciales Segunda Vuelta",
          node: (
            <ParrillaView
              table="parrilla_votaciones_segunda_vuelta_cne"
              title="Presidenciales Segunda Vuelta · CNE"
            />
          ),
        },
      ];
    }
    return [
      {
        key: "presidenciales",
        label: "Presidenciales",
        node: (
          <ParrillaView
            table="parrilla_presidenciales_ae"
            title="Parrilla Presidenciales · Actores Electorales"
          />
        ),
      },
      {
        key: "mision",
        label: "Misión de Observación",
        node: (
          <ParrillaView
            table="parrilla_actores_electorales"
            title="Misión de Observación Internacional · Actores Electorales"
          />
        ),
      },
      {
        key: "moi",
        label: "MOI 2.0",
        node: (
          <ParrillaView
            table="parrilla_moi_ae"
            title="MOI 2.0 · Actores Electorales"
          />
        ),
      },
      {
        key: "votaciones-segunda-vuelta",
        label: "Presidenciales Segunda Vuelta",
        node: (
          <ParrillaView
            table="parrilla_votaciones_segunda_vuelta_ae"
            title="Presidenciales Segunda Vuelta · Actores Electorales"
          />
        ),
      },
    ];
  }, [vertical]);

  const dynamicTabs = useMemo<Tab[]>(() =>
    customTabs.map((ct) => ({
      key: ct.key,
      label: ct.label,
      deletable: isAdmin,
      node: (
        <ParrillaView
          table={ct.table_name}
          title={`${ct.label} · ${vertical.toUpperCase()}`}
        />
      ),
    })),
    [customTabs, vertical, isAdmin]
  );

  const handleDeleteTab = (key: string) => {
    const tab = customTabs.find((ct) => ct.key === key);
    if (tab) setDeleteTarget(tab);
  };

  const confirmDeleteTab = async () => {
    if (!deleteTarget) return;
    await supabase.from("parrilla_custom_tabs").delete().eq("id", deleteTarget.id);
    setCustomTabs((prev) => prev.filter((ct) => ct.id !== deleteTarget.id));
    if (active === deleteTarget.key) setActive(hardcodedTabs[0].key);
    setDeleteTarget(null);
  };

  const tabs = [...hardcodedTabs, ...dynamicTabs];

  const defaultKey =
    tabs.find((t) => t.key === "votaciones-segunda-vuelta")?.key ??
    tabs.find((t) => t.key === "moi")?.key ??
    tabs[0].key;
  const [active, setActive] = useState(defaultKey);
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveTab = async () => {
    if (!newTabLabel.trim() || !newTableName) return;
    setSaving(true);
    setSaveError("");
    const { error } = await supabase.from("parrilla_custom_tabs").insert({
      vertical,
      key: newTabKey,
      label: newTabLabel.trim(),
      table_name: newTableName,
    });
    if (error) {
      console.error("parrilla_custom_tabs insert error:", error);
      setSaveError(`Error: ${error.message || error.code || JSON.stringify(error)}`);
      setSaving(false);
      return;
    }
    await loadCustomTabs();
    setActive(newTabKey);
    setShowModal(false);
    setNewTabLabel("");
    setCopied(false);
    setSaving(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setNewTabLabel("");
    setCopied(false);
    setSaveError("");
  };

  return (
    <div>
      <div className="mb-6 flex items-start gap-2">
        <TabBar
          tabs={tabs}
          active={active}
          onChange={setActive}
          onDelete={isAdmin ? handleDeleteTab : undefined}
          groupId={`parrillas-${vertical}`}
        />
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            title="Nueva parrilla"
            className="glass flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-[var(--text-dim)] transition-colors hover:text-[var(--text)] hover:neon-border"
          >
            +
          </button>
        )}
      </div>

      <div key={current.key}>{current.node}</div>

      {/* Modal confirmación eliminar tab */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass w-full max-w-sm rounded-2xl p-6 shadow-2xl">
            <h2 className="mb-1 text-base font-bold text-[var(--text)]">¿Eliminar tab?</h2>
            <p className="mb-1 text-sm text-[var(--text-dim)]">
              Se eliminará <span className="font-bold text-[var(--text)]">{deleteTarget.label}</span> de la barra de pestañas.
            </p>
            <p className="mb-5 text-xs text-[var(--text-faint)]">
              Los datos de la tabla{" "}
              <code className="font-mono text-[var(--accent)]">{deleteTarget.table_name}</code>{" "}
              en Supabase <strong>no se borran</strong>. Si quieres eliminarlos también, ejecuta:{" "}
              <code className="font-mono">drop table public.{deleteTarget.table_name};</code>
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl px-4 py-2 text-sm text-[var(--text-dim)] transition-colors hover:text-[var(--text)]"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteTab}
                className="rounded-xl px-5 py-2 text-sm font-bold text-red-400 transition-all hover:bg-red-500/10"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nueva parrilla */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}
        >
          <div className="glass w-full max-w-lg rounded-2xl p-6 shadow-2xl">
            <h2 className="mb-1 text-lg font-bold text-[var(--text)]">Nueva parrilla</h2>
            <p className="mb-5 text-sm text-[var(--text-dim)]">
              Escribe el nombre, copia el SQL, ejecútalo en Supabase y luego guarda.
            </p>

            {/* Nombre */}
            <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-[var(--text-dim)]">
              Nombre de la parrilla
            </label>
            <input
              autoFocus
              value={newTabLabel}
              onChange={(e) => { setNewTabLabel(e.target.value); setSaveError(""); }}
              placeholder="Ej: Segunda Vuelta, MOI 3.0..."
              className="glass mb-4 w-full rounded-xl px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:neon-border focus:outline-none"
            />

            {/* Preview tabla */}
            {newTableName && (
              <div className="mb-4 rounded-xl bg-white/5 px-4 py-2.5">
                <span className="text-xs text-[var(--text-dim)]">Tabla en Supabase: </span>
                <code className="text-xs font-mono text-[var(--accent)]">{newTableName}</code>
              </div>
            )}

            {/* SQL */}
            {sql && (
              <div className="mb-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-widest text-[var(--text-dim)]">
                    SQL para Supabase
                  </label>
                  <button
                    onClick={handleCopySQL}
                    className="rounded-lg px-3 py-1 text-xs font-bold transition-colors"
                    style={{ background: copied ? "var(--accent-soft)" : "rgba(255,255,255,0.07)", color: copied ? "var(--accent)" : "var(--text-dim)" }}
                  >
                    {copied ? "✓ Copiado" : "Copiar"}
                  </button>
                </div>
                <pre className="max-h-48 overflow-auto rounded-xl bg-black/40 p-3 text-xs leading-relaxed text-[var(--text-dim)]">
                  {sql}
                </pre>
              </div>
            )}

            {saveError && (
              <p className="mb-3 text-xs text-red-400">{saveError}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={handleCloseModal}
                className="rounded-xl px-4 py-2 text-sm text-[var(--text-dim)] transition-colors hover:text-[var(--text)]"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTab}
                disabled={!newTabLabel.trim() || saving}
                className="rounded-xl px-5 py-2 text-sm font-bold transition-all disabled:opacity-40"
                style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
              >
                {saving ? "Guardando..." : "Guardar tab"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
