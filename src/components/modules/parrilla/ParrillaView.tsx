"use client";

import React, { useEffect, useState } from "react";
import { getDb } from "@/lib/supabase";
import { DbStatus } from "@/components/ui/DbStatus";
import { useLayout } from "@/context/LayoutContext";
import { ParrillaExcelImport } from "./ParrillaExcelImport";

const supabase = getDb("analytics");

/* ======================================================================
   Tipos y constantes (migrados desde data/mockData.ts)
   ====================================================================== */
interface ViewerComment {
  id: string;
  name: string;
  comment: string;
  timestamp: string;
}

interface ContentItem {
  id: string;
  time: string; // "HH:MM" entre 07:00 y 22:59
  platform: "facebook" | "instagram" | "tiktok" | "x";
  type:
    | "post"
    | "reel"
    | "Story"
    | "Trino"
    | "Trino + imagen"
    | "entrecomillados"
    | "Espacio reservado";
  description: string;
  status:
    | "Publicado"
    | "No Publicado"
    | "Programado"
    | "Rechazado"
    | "Por crear contenido"
    | "Paso a CNE";
  duration: number; // minutos
  url?: string;
  comments?: string;
  kpi?: string;
  viewerComments?: ViewerComment[];
}

const HOURS = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
  "19:00", "20:00", "21:00", "22:00",
];

const PLATFORMS = [
  { id: "facebook", name: "Facebook", color: "#1877F2", icon: "FB" },
  { id: "instagram", name: "Instagram", color: "#E4405F", icon: "IG" },
  { id: "tiktok", name: "TikTok", color: "#000000", icon: "TT" },
  { id: "x", name: "X (Twitter)", color: "#7c3aed", icon: "X" },
] as const;

type PlatformId = (typeof PLATFORMS)[number]["id"];

const PLATFORM_ACCENT: Record<PlatformId, string> = {
  facebook: "#3b82f6",
  instagram: "#ec4899",
  tiktok: "#22d3ee",
  x: "#a78bfa",
};

/* Estilos suaves para badges de tipo (variante /10 manteniendo color) */
function typeBadgeClass(type: ContentItem["type"]): string {
  switch (type) {
    case "post":
      return "bg-blue-500/15 text-blue-300";
    case "reel":
      return "bg-fuchsia-500/15 text-fuchsia-300";
    case "Story":
      return "bg-amber-500/15 text-amber-300";
    case "Trino":
      return "bg-sky-500/15 text-sky-300";
    case "Trino + imagen":
      return "bg-indigo-500/15 text-indigo-300";
    case "Espacio reservado":
      return "bg-white/10 text-[var(--text-dim)] border border-dashed border-white/20";
    default:
      return "bg-violet-500/15 text-violet-300"; // entrecomillados
  }
}

/* Estilos suaves para badges de estado */
function statusBadgeClass(status: ContentItem["status"]): string {
  switch (status) {
    case "Publicado":
      return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20";
    case "Programado":
      return "bg-sky-500/15 text-sky-300 border border-sky-500/20";
    case "Rechazado":
      return "bg-rose-500/15 text-rose-300 border border-rose-500/20";
    case "Por crear contenido":
      return "bg-amber-500/15 text-amber-300 border border-amber-500/20";
    case "Paso a CNE":
      return "bg-cyan-500/15 text-cyan-300 border border-cyan-500/20";
    default:
      return "bg-white/10 text-[var(--text-dim)] border border-white/15"; // No Publicado
  }
}

/* ======================================================================
   ParrillaView — toda la lógica/UI parametrizada por `table`
   ====================================================================== */
export function ParrillaView({ table, title }: { table: string; title: string }) {
  const storageKey = `${table}_list`;

  const [isMounted, setIsMounted] = useState(false);
  const { userRole: role } = useLayout();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formId, setFormId] = useState("");
  const [formHour, setFormHour] = useState("07");
  const [formMinute, setFormMinute] = useState("00");
  const [formDuration, setFormDuration] = useState<number>(10);
  const [formPlatform, setFormPlatform] = useState<PlatformId>("facebook");
  const [formType, setFormType] = useState<ContentItem["type"]>("post");
  const [formStatus, setFormStatus] = useState<ContentItem["status"]>("Programado");
  const [formDescription, setFormDescription] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formComments, setFormComments] = useState("");
  const [formKpi, setFormKpi] = useState("");
  const [viewItem, setViewItem] = useState<ContentItem | null>(null);
  // Aviso de conflicto: otro usuario editó el ítem que tenemos abierto en el modal
  const [modalConflict, setModalConflict] = useState(false);

  // Dragging states
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragStartY, setDragStartY] = useState<number>(0);
  const [dragStartTime, setDragStartTime] = useState<string>("07:00");
  const [hasMoved, setHasMoved] = useState(false);

  // Refs para evitar closures obsoletos en callbacks de realtime y drag
  const draggingIdRef = React.useRef<string | null>(null);
  const contentListRef = React.useRef<ContentItem[]>([]);
  const formIdRef = React.useRef<string>("");

  // Mantener refs sincronizados con el estado
  React.useEffect(() => { draggingIdRef.current = draggingId; }, [draggingId]);
  React.useEffect(() => { contentListRef.current = contentList; }, [contentList]);
  React.useEffect(() => { formIdRef.current = formId; }, [formId]);

  // Viewer comment states
  const [viewerCommentName, setViewerCommentName] = useState("");
  const [viewerCommentText, setViewerCommentText] = useState("");

  // Delete confirmation state
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setCurrentTime(new Date());

    const timer = setInterval(() => setCurrentTime(new Date()), 30000);

    const loadContent = async () => {
      try {
        const { data, error } = await supabase.from(table).select("*");
        if (error) throw error;

        if (data && data.length) {
          const defaultRow = data.find((r) => r.id === "default");
          const individualItems = data
            .filter((r) => r.id !== "default")
            .map(
              (r) =>
                ({
                  id: r.id,
                  time: r.time,
                  platform: r.platform,
                  type: r.type,
                  description: r.description,
                  status: r.status,
                  duration: r.duration,
                  url: r.url,
                  comments: r.comments,
                  kpi: r.kpi,
                  viewerComments: r.viewer_comments || [],
                } as ContentItem)
            );

          // Si existen items individuales Y una fila default, limpiamos el default (residuo legacy).
          if (defaultRow && individualItems.length > 0) {
            console.log("Detected stale legacy row. Cleaning up...");
            await supabase.from(table).delete().eq("id", "default");
            setContentList(individualItems);
            localStorage.setItem(storageKey, JSON.stringify(individualItems));
          } else if (defaultRow && Array.isArray(defaultRow.content)) {
            // MIGRACIÓN: solo si no hay items individuales aún
            console.log("Migrating legacy data to new multi-row structure...");
            const legacyItems = defaultRow.content as ContentItem[];
            for (const item of legacyItems) {
              await supabase.from(table).upsert({
                id: item.id,
                time: item.time,
                platform: item.platform,
                type: item.type,
                description: item.description,
                status: item.status,
                duration: item.duration,
                url: item.url,
                comments: item.comments,
                kpi: item.kpi,
                viewer_comments: item.viewerComments,
              });
            }
            await supabase.from(table).delete().eq("id", "default");

            const { data: migratedData } = await supabase.from(table).select("*");
            const items = (migratedData || [])
              .filter((r) => r.id !== "default")
              .map(
                (r) =>
                  ({
                    id: r.id,
                    time: r.time,
                    platform: r.platform,
                    type: r.type,
                    description: r.description,
                    status: r.status,
                    duration: r.duration,
                    url: r.url,
                    comments: r.comments,
                    kpi: r.kpi,
                    viewerComments: r.viewer_comments || [],
                  } as ContentItem)
              );
            setContentList(items);
            localStorage.setItem(storageKey, JSON.stringify(items));
          } else {
            setContentList(individualItems);
            localStorage.setItem(storageKey, JSON.stringify(individualItems));
          }
        } else {
          setContentList([]);
          localStorage.removeItem(storageKey);
        }
      } catch (e) {
        console.error("Error in loadContent:", e);
        const saved = localStorage.getItem(storageKey);
        if (saved) setContentList(JSON.parse(saved));
      }
    };

    loadContent();

    // Realtime — escucha TODOS los cambios de la tabla
    const channel = supabase
      .channel(`schema-db-changes-${table}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table,
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const raw = payload.new as any;
            if (!raw.id) return;

            // No pisar el ítem que el usuario local está arrastrando en este momento
            if (raw.id === draggingIdRef.current) return;

            const newItem: ContentItem = {
              id: raw.id,
              time: raw.time,
              platform: raw.platform,
              type: raw.type,
              description: raw.description,
              status: raw.status,
              duration: raw.duration,
              url: raw.url,
              comments: raw.comments,
              kpi: raw.kpi,
              viewerComments: raw.viewer_comments || [],
            };

            // Si el modal está abierto editando este ítem, avisar del conflicto
            // en lugar de sobreescribir silenciosamente los campos del form
            if (raw.id === formIdRef.current && formIdRef.current !== "") {
              setModalConflict(true);
            }

            setContentList((prev) => {
              const idx = prev.findIndex((i) => i.id === newItem.id);
              let updated;
              if (idx > -1) {
                updated = [...prev];
                updated[idx] = newItem;
              } else {
                updated = [...prev, newItem];
              }
              localStorage.setItem(storageKey, JSON.stringify(updated));
              return updated;
            });
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as any).id;
            if (deletedId === "default") {
              loadContent();
              return;
            }
            setContentList((prev) => {
              const updated = prev.filter((item) => item.id !== deletedId);
              localStorage.setItem(storageKey, JSON.stringify(updated));
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  useEffect(() => {
    if (!draggingId || role !== "admin") return;

    const onMouseMove = (e: MouseEvent) => {
      setHasMoved(true);
      const deltaY = e.clientY - dragStartY;
      const deltaMinutes = Math.round(deltaY / 3);

      const [h, m] = dragStartTime.split(":").map(Number);
      let totalMinutes = h * 60 + m + deltaMinutes;
      totalMinutes = Math.max(7 * 60, Math.min(22 * 60 + 59, totalMinutes));
      totalMinutes = Math.round(totalMinutes / 5) * 5;

      const newH = Math.floor(totalMinutes / 60);
      const newM = totalMinutes % 60;
      const newTime = `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`;

      setContentList((prev) =>
        prev.map((item) =>
          item.id === draggingId ? { ...item, time: newTime } : item
        )
      );
    };

    const onMouseUp = async () => {
      const currentDraggingId = draggingId;
      setDraggingId(null);
      // Usar el ref para tener la lista más reciente sin que sea dep del efecto
      const list = contentListRef.current;
      localStorage.setItem(storageKey, JSON.stringify(list));
      try {
        const draggedItem = list.find((item) => item.id === currentDraggingId);
        if (draggedItem) {
          // Solo actualizar el campo `time` para no pisar cambios concurrentes
          // en otros campos (descripción, status, etc.) hechos por otros usuarios
          await supabase.from(table).update({ time: draggedItem.time }).eq("id", draggedItem.id);
        }
      } catch (e) {
        console.error("Error auto-saving after drag:", e);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    // contentList eliminado de las deps: usamos contentListRef para evitar
    // que el efecto se re-ejecute (y re-adjunte listeners) cada vez que
    // el realtime actualiza la lista durante un drag en curso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingId, dragStartY, dragStartTime, role]);

  const handleOpenAddModal = (time: string, platform: PlatformId) => {
    if (role !== "admin") return;
    setFormId("");
    setModalConflict(false);
    const [h, m] = time.split(":");
    setFormHour(h || "07");
    setFormMinute(m || "00");
    setFormDuration(10);
    setFormPlatform(platform);
    setFormType("post");
    setFormStatus("Programado");
    setFormDescription("");
    setFormUrl("");
    setFormComments("");
    setFormKpi("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ContentItem) => {
    if (role !== "admin") return;
    setFormId(item.id);
    setModalConflict(false);
    const [h, m] = item.time.split(":");
    setFormHour(h || "07");
    setFormMinute(m || "00");
    setFormDuration(item.duration || 60);
    setFormPlatform(item.platform);
    setFormType(item.type);
    setFormStatus(item.status as any);
    setFormDescription(item.description);
    setFormUrl(item.url || "");
    setFormComments(item.comments || "");
    setFormKpi(item.kpi || "");
    setIsModalOpen(true);
  };

  // Recargar el form con los datos más recientes del ítem en conflicto
  const handleReloadConflictItem = () => {
    const fresh = contentListRef.current.find((i) => i.id === formId);
    if (fresh) handleOpenEditModal(fresh);
  };

  const handleDragStart = (e: React.MouseEvent, item: ContentItem) => {
    if (role !== "admin") return;
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button")) return;

    setDraggingId(item.id);
    setDragStartY(e.clientY);
    setDragStartTime(item.time);
    setHasMoved(false);
  };

  const handleDeleteItem = async () => {
    if (role !== "admin" || !itemToDelete) return;

    setIsSaving(true);
    setIsModalOpen(false);

    try {
      const { error, count } = await supabase
        .from(table)
        .delete({ count: "exact" })
        .eq("id", itemToDelete);
      if (error) throw error;

      if (count === 0) {
        throw new Error(
          "No se pudo eliminar en la base de datos. Por favor, asegúrate de habilitar la política RLS de DELETE en Supabase."
        );
      }

      console.log(`Item ${itemToDelete} deleted from DB.`);

      setContentList((prev) => {
        const updated = prev.filter((item) => item.id !== itemToDelete);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
      setItemToDelete(null);
    } catch (e: any) {
      console.error("Supabase delete error:", e);
      alert("Error al eliminar en la nube: " + (e.message || "Error desconocido"));
      setErrorMsg(e.message || "Error al eliminar en la nube.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddViewerComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewItem) return;
    if (!viewerCommentName.trim() || !viewerCommentText.trim()) {
      alert("Por favor, ingresa tu nombre y un comentario.");
      return;
    }

    const now = new Date();
    const timestamp = now.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const newComment = {
      id: Date.now().toString(),
      name: viewerCommentName,
      comment: viewerCommentText,
      timestamp: timestamp,
    };

    setIsSaving(true);
    try {
      const updatedItem = {
        ...viewItem,
        viewerComments: [...(viewItem.viewerComments || []), newComment],
      };

      const { error } = await supabase.from(table).upsert({
        id: viewItem.id,
        time: updatedItem.time,
        platform: updatedItem.platform,
        type: updatedItem.type,
        description: updatedItem.description,
        status: updatedItem.status,
        duration: updatedItem.duration,
        url: updatedItem.url,
        comments: updatedItem.comments,
        kpi: updatedItem.kpi,
        viewer_comments: updatedItem.viewerComments,
      });
      if (error) throw error;

      setViewItem(updatedItem);
      setContentList((prev) =>
        prev.map((item) => (item.id === viewItem.id ? updatedItem : item))
      );

      setViewerCommentName("");
      setViewerCommentText("");
    } catch (e: any) {
      console.error("Error saving viewer comment:", e);
      setErrorMsg(e.message || "Error al guardar comentario.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveItem = async (e: React.FormEvent, forceNew: boolean = false) => {
    e.preventDefault();
    if (!formDescription.trim()) {
      alert("Por favor, escribe el texto o descripción del contenido.");
      return;
    }

    const currentFormId = forceNew ? "" : formId;
    const timeStr = `${formHour}:${formMinute}`;

    const existingItem = contentList.find((i) => i.id === currentFormId);

    const newItem: ContentItem = {
      id: currentFormId || Date.now().toString(),
      time: timeStr,
      platform: formPlatform,
      type: formType,
      status: formStatus,
      description: formDescription,
      duration: Number(formDuration),
      url: formUrl,
      comments: formComments,
      kpi: formKpi,
      viewerComments: existingItem ? existingItem.viewerComments : [],
    };

    setIsSaving(true);
    try {
      const { error } = await supabase.from(table).upsert({
        id: newItem.id,
        time: newItem.time,
        platform: newItem.platform,
        type: newItem.type,
        description: newItem.description,
        status: newItem.status,
        duration: newItem.duration,
        url: newItem.url,
        comments: newItem.comments,
        kpi: newItem.kpi,
        viewer_comments: newItem.viewerComments,
      });
      if (error) throw error;

      setContentList((prev) => {
        const index = prev.findIndex((item) => item.id === newItem.id);
        let updated;
        if (index > -1) {
          updated = [...prev];
          updated[index] = newItem;
        } else {
          updated = [...prev, newItem];
        }
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });

      setIsModalOpen(false);
    } catch (e: any) {
      console.error("Supabase save error:", e);
      setErrorMsg(e.message || "Error al guardar en la nube.");
    } finally {
      setIsSaving(false);
    }
  };

  // Cerrar modal con Escape
  useEffect(() => {
    if (!isModalOpen && !viewItem && !itemToDelete) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsModalOpen(false);
        setModalConflict(false);
        setViewItem(null);
        setItemToDelete(null);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isModalOpen, viewItem, itemToDelete]);

  if (!isMounted) {
    return null; // Evita saltos de hidratación
  }

  const inputClass =
    "glass w-full rounded-xl px-3.5 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-faint)] focus:neon-border focus:outline-none";
  const labelClass =
    "text-[11px] font-bold uppercase tracking-wider text-[var(--text-dim)]";

  return (
    <div className="space-y-6 pb-12">
      {isSaving && (
        <div className="glass-strong fixed bottom-6 right-6 z-[200] rounded-xl px-4 py-2 text-sm font-bold text-[var(--text)] neon-glow">
          Guardando...
        </div>
      )}
      {errorMsg && (
        <div className="glass rounded-xl border border-rose-500/30 px-4 py-3 text-sm text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* Cabecera */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text)]">
            {title}
          </h1>
          <p className="text-sm text-[var(--text-dim)]">
            Parrilla de contenidos · planificación por hora y plataforma
          </p>
        </div>
        <div className="flex items-center gap-3">
          {role === "admin" && (
            <ParrillaExcelImport
              table={table}
              onImported={(items) => {
                setContentList((prev) => {
                  const updated = [...prev, ...items];
                  localStorage.setItem(storageKey, JSON.stringify(updated));
                  return updated;
                });
              }}
            />
          )}
          <DbStatus db="analytics" table={table} />
        </div>
      </div>

      {/* Banner informativo */}
      {role === "admin" ? (
        <div className="glass flex items-center gap-3 rounded-xl px-5 py-3.5 text-sm text-[var(--text-dim)]">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0 text-[var(--accent)]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.063.852l-.708.286a.75.75 0 01-1.063-.852l.708-.286zm0 0L10.5 12.75M12 20.25a8.25 8.25 0 100-16.5 8.25 8.25 0 000 16.5z" />
          </svg>
          <span>
            <strong className="text-[var(--text)]">Modo Editor Activo:</strong> Puedes hacer clic sobre cualquier celda vacía para programar contenido, o editar/eliminar las publicaciones existentes de la grilla.
          </span>
        </div>
      ) : (
        <div className="glass flex items-center gap-3 rounded-xl px-5 py-3.5 text-sm text-[var(--text-dim)]">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0 text-[var(--accent)]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>
            <strong className="text-[var(--text)]">Modo de Solo Lectura:</strong> Tienes acceso a visualizar toda la planificación, pero no puedes añadir ni modificar publicaciones.
          </span>
        </div>
      )}

      {/* Grilla de la parrilla */}
      <div className="glass max-h-[calc(100vh-220px)] overflow-auto rounded-2xl">
        <div
          className="grid min-w-[1200px]"
          style={{ gridTemplateColumns: "90px repeat(4, minmax(280px, 1fr))" }}
        >
          {/* Encabezados de columna */}
          <div className="sticky left-0 top-0 z-[100] flex items-center justify-center border-b border-white/10 bg-[var(--bg-2)]/80 p-5 text-sm font-bold text-[var(--text-dim)] backdrop-blur">
            Hora
          </div>
          {PLATFORMS.map((plat) => (
            <div
              key={plat.id}
              className="sticky top-0 z-20 flex items-center gap-2 border-b border-white/10 bg-[var(--bg-2)]/80 p-5 text-sm font-bold backdrop-blur"
              style={{
                color: PLATFORM_ACCENT[plat.id],
                borderBottom: `3px solid ${PLATFORM_ACCENT[plat.id]}`,
              }}
            >
              {plat.id === "facebook" && (
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              )}
              {plat.id === "instagram" && (
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              )}
              {plat.id === "tiktok" && (
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.94-1.74-.22-.22-.4-.45-.58-.7v5.13c.05 3.07-1.41 6.03-4.14 7.36-2.83 1.43-6.52 1.05-8.93-1.07-2.45-2.14-3.28-5.74-2.02-8.77C3.99 7.48 7.34 5.3 10.72 5.7c.2.02.4.06.6.1v4.09c-.89-.26-1.89-.2-2.7.25-.95.53-1.52 1.57-1.54 2.66-.02 1.55 1.25 2.91 2.8 2.91 1.49-.03 2.72-1.22 2.78-2.71.02-3.14.01-6.28.01-9.42-.01-.18-.09-.34-.15-.5z" />
                </svg>
              )}
              {plat.id === "x" && (
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              )}
              {plat.name}
            </div>
          ))}

          {/* Cuerpo de la grilla */}
          {HOURS.map((hour) => {
            let isActive = false;
            let progressPercent = 0;

            if (currentTime) {
              const currentH = currentTime.getHours();
              const currentM = currentTime.getMinutes();
              const rowH = parseInt(hour.split(":")[0], 10);

              isActive = currentH === rowH;
              progressPercent = (currentM / 60) * 100;
            }

            return (
              <React.Fragment key={hour}>
                {/* Celda indicador de hora */}
                <div
                  className={`sticky left-0 z-50 h-[180px] border-b border-r border-white/10 bg-[var(--bg-2)]/80 p-0 backdrop-blur ${
                    isActive ? "bg-amber-500/10" : ""
                  }`}
                >
                  <div className="flex h-full w-full flex-col justify-between py-1">
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((min) => {
                      const isMainHour = min === 0;
                      return (
                        <div
                          key={min}
                          className={`text-center font-mono ${
                            isMainHour
                              ? "text-sm font-extrabold text-[var(--text)]"
                              : "text-[10px] font-medium text-[var(--text-faint)] opacity-70"
                          }`}
                        >
                          {hour.split(":")[0]}:{min.toString().padStart(2, "0")}
                        </div>
                      );
                    })}
                  </div>

                  {isActive && (
                    <>
                      <div
                        className="pointer-events-none absolute left-0 right-0 z-20 h-0.5 bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]"
                        style={{ top: `${progressPercent}%` }}
                      />
                      <div
                        className="pointer-events-none absolute z-[21] h-2.5 w-2.5 rounded-full border-2 border-[var(--bg)] bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)]"
                        style={{ right: "-5px", top: `calc(${progressPercent}% - 4px)` }}
                      />
                    </>
                  )}
                </div>

                {/* Celdas de plataforma para esta hora */}
                {PLATFORMS.map((plat) => {
                  const cellItems = contentList.filter((item) => {
                    const [itemH] = item.time.split(":");
                    const [rowH] = hour.split(":");
                    return itemH === rowH && item.platform === plat.id;
                  });

                  return (
                    <div
                      key={`${hour}-${plat.id}`}
                      className={`group relative h-[180px] border-b border-r border-white/5 transition-colors hover:bg-white/5 ${
                        isActive ? "bg-amber-500/5" : ""
                      }`}
                      onClick={() =>
                        role === "admin" && handleOpenAddModal(hour, plat.id)
                      }
                    >
                      {isActive && (
                        <div
                          className="pointer-events-none absolute left-0 right-0 z-20 h-0.5 bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]"
                          style={{ top: `${progressPercent}%` }}
                        />
                      )}

                      {role === "admin" && (
                        <button
                          className="absolute right-1.5 top-1.5 z-40 flex h-5 w-5 items-center justify-center rounded-full accent-bg text-sm font-bold text-black opacity-0 transition group-hover:opacity-100 hover:neon-glow"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAddModal(hour, plat.id);
                          }}
                          title="Añadir otro contenido a esta hora"
                        >
                          +
                        </button>
                      )}

                      {cellItems.map((cellItem, index) => {
                        const startMin =
                          parseInt(cellItem.time.split(":")[1], 10) || 0;
                        const topPercent = (startMin / 60) * 100;
                        const heightPercent = ((cellItem.duration || 60) / 60) * 100;
                        const isShort = (cellItem.duration || 60) <= 30;

                        return (
                          <div
                            key={cellItem.id}
                            className={`glass absolute flex flex-col justify-between gap-2 overflow-hidden rounded-xl transition-all hover:-translate-y-0.5 hover:neon-border ${
                              role === "admin" ? "cursor-grab" : ""
                            } ${draggingId === cellItem.id ? "cursor-grabbing opacity-90" : ""}`}
                            style={{
                              top: `${topPercent}%`,
                              height: `${heightPercent}%`,
                              left: `${(index / cellItems.length) * 100}%`,
                              width: `${100 / cellItems.length}%`,
                              padding:
                                cellItems.length > 1 ? "6px 4px" : "10px 12px",
                              zIndex: draggingId === cellItem.id ? 100 : 10 + index,
                              borderLeft: `4px solid ${PLATFORM_ACCENT[plat.id]}`,
                            }}
                            onMouseDown={(e) => handleDragStart(e, cellItem)}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (hasMoved) return;

                              if (role === "admin") {
                                handleOpenEditModal(cellItem);
                              } else {
                                setViewItem(cellItem);
                              }
                            }}
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex flex-wrap gap-1.5">
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${typeBadgeClass(
                                    cellItem.type
                                  )}`}
                                >
                                  {cellItem.type}
                                </span>
                              </div>

                              <span
                                className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${statusBadgeClass(
                                  cellItem.status
                                )}`}
                              >
                                {cellItem.time} - {cellItem.status}
                              </span>
                            </div>

                            <p
                              className={`break-words font-medium text-[var(--text)] ${
                                isShort ? "text-[11.5px] leading-snug" : "text-[13px] leading-normal"
                              }`}
                              style={{
                                display: "-webkit-box",
                                WebkitLineClamp: isShort ? 2 : 4,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                              title={cellItem.description}
                            >
                              <br />
                              {cellItem.description}
                              {cellItem.url && (
                                <a
                                  href={cellItem.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[var(--accent)] underline"
                                  title={cellItem.url}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <br />
                                  {cellItem.url}
                                </a>
                              )}
                            </p>

                            {role === "admin" && (
                              <div className="mt-1 flex justify-end gap-2 border-t border-white/10 pt-2">
                                <button
                                  className="flex items-center justify-center rounded-md p-1 text-[var(--text-dim)] transition hover:bg-white/10 hover:text-[var(--accent)]"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditModal(cellItem);
                                  }}
                                  title="Editar publicación"
                                >
                                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                  </svg>
                                </button>
                                <button
                                  className="flex items-center justify-center rounded-md p-1 text-[var(--text-dim)] transition hover:bg-rose-500/15 hover:text-rose-300"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setItemToDelete(cellItem.id);
                                  }}
                                  title="Eliminar publicación"
                                >
                                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Placeholder de celda vacía */}
                      {role === "admin" && (
                        <div className="pointer-events-none absolute left-1/2 top-1/2 z-[1] flex h-[calc(100%-24px)] w-[calc(100%-24px)] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 text-[var(--accent)] opacity-0 transition group-hover:opacity-100">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-soft)] text-base font-bold">
                            +
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-wider">
                            Agregar
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Modal Guardar / Editar */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) { setIsModalOpen(false); setModalConflict(false); }
          }}
        >
          <div className="glass-strong relative h-[80dvh] w-full max-w-[700px] overflow-y-auto rounded-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <h2 className="text-lg font-extrabold text-[var(--text)]">
                {formId ? "Contenido" : "Agregar a Parrilla"}
              </h2>
              <button
                type="button"
                className="flex items-center justify-center rounded-full p-1 text-[var(--text-dim)] transition hover:bg-white/10 hover:text-[var(--text)]"
                onClick={() => { setIsModalOpen(false); setModalConflict(false); }}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {modalConflict && (
              <div className="mx-6 mt-4 flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                <span>⚠️ Otro usuario modificó este ítem mientras lo editabas.</span>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={handleReloadConflictItem}
                    className="rounded-lg bg-amber-500/20 px-3 py-1 text-xs font-bold hover:bg-amber-500/30"
                  >
                    Ver cambios
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalConflict(false)}
                    className="rounded-lg bg-white/10 px-3 py-1 text-xs font-bold hover:bg-white/15"
                  >
                    Ignorar
                  </button>
                </div>
              </div>
            )}
            <form onSubmit={handleSaveItem}>
              <div className="flex flex-col gap-5 p-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className={labelClass}>Hora Publicación</label>
                    <select
                      className={inputClass}
                      value={formHour}
                      onChange={(e) => setFormHour(e.target.value)}
                    >
                      {HOURS.map((h) => {
                        const hr = h.split(":")[0];
                        return (
                          <option key={hr} value={hr}>
                            {hr}:
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={labelClass}>Minuto Publicación</label>
                    <select
                      className={inputClass}
                      value={formMinute}
                      onChange={(e) => setFormMinute(e.target.value)}
                    >
                      {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map(
                        (mm) => (
                          <option key={mm} value={mm}>
                            {mm}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={labelClass}>Duración</label>
                    <select
                      className={inputClass}
                      value={formDuration}
                      onChange={(e) => setFormDuration(Number(e.target.value))}
                    >
                      <option value={10}>10 minutos</option>
                      <option value={15}>15 minutos</option>
                      <option value={30}>30 minutos</option>
                      <option value={45}>45 minutos</option>
                      <option value={60}>60 minutos (1 hora)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={labelClass}>Publicar en</label>
                    <select
                      className={inputClass}
                      value={formPlatform}
                      onChange={(e) => setFormPlatform(e.target.value as PlatformId)}
                    >
                      {PLATFORMS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={labelClass}>Tipo de Contenido</label>
                    <select
                      className={inputClass}
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as any)}
                    >
                      <option value="post">Post</option>
                      <option value="reel">Reel</option>
                      <option value="Story">Story</option>
                      <option value="Trino">Trino</option>
                      <option value="Trino + imagen">Trino + imagen</option>
                      <option value="entrecomillados">entrecomillados</option>
                      <option value="Espacio reservado">Espacio reservado</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={labelClass}>Estado</label>
                    <select
                      className={inputClass}
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                    >
                      <option value="Publicado">Publicado</option>
                      <option value="No Publicado">No Publicado</option>
                      <option value="Programado">Programado</option>
                      <option value="Rechazado">Rechazado</option>
                      <option value="Por crear contenido">Por crear contenido</option>
                      <option value="Paso a CNE">Paso a CNE</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className={labelClass}>KPI objetivo</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Ej: 1000 likes, 500 clics..."
                      value={formKpi}
                      onChange={(e) => setFormKpi(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className={labelClass}>Copy del contenido</label>
                    <textarea
                      className={`${inputClass} min-h-[120px] resize-y`}
                      placeholder="Escribe aquí el copy de la publicación, hashtags o instrucciones técnicas..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className={labelClass}>Link de piezas</label>
                    <input
                      type="url"
                      className={inputClass}
                      placeholder="https://..."
                      value={formUrl}
                      onChange={(e) => setFormUrl(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className={labelClass}>Comentarios de publicadores</label>
                    <textarea
                      className={`${inputClass} min-h-[80px] resize-y`}
                      placeholder="Escribe aquí los comentarios..."
                      value={formComments}
                      onChange={(e) => setFormComments(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-white/10 p-4">
                <button
                  type="button"
                  className="glass rounded-xl px-4 py-2.5 text-sm font-bold text-[var(--text-dim)] transition hover:text-[var(--text)]"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                {formId && (
                  <button
                    type="button"
                    className="glass rounded-xl px-4 py-2.5 text-sm font-bold text-[var(--accent)] transition hover:neon-border"
                    onClick={(e) => {
                      handleSaveItem(e, true);
                    }}
                    title="Crea una copia de este contenido en lugar de editar el original"
                  >
                    Guardar como nuevo
                  </button>
                )}
                <button
                  type="submit"
                  className="accent-bg rounded-xl px-5 py-2.5 text-sm font-bold text-black transition hover:neon-glow"
                >
                  {formId ? "Guardar Cambios" : "Guardar en Parrilla"}
                </button>
                {formId && (
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 text-rose-300 transition hover:bg-rose-500/25"
                    onClick={() => setItemToDelete(formId)}
                    title="Eliminar esta publicación"
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Visualización (modo viewer) */}
      {viewItem && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewItem(null);
          }}
        >
          <div className="glass-strong relative h-[80dvh] w-full max-w-[700px] overflow-y-auto rounded-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <h2 className="text-lg font-extrabold text-[var(--text)]">Contenido</h2>
              <button
                type="button"
                className="flex items-center justify-center rounded-full p-1 text-[var(--text-dim)] transition hover:bg-white/10 hover:text-[var(--text)]"
                onClick={() => setViewItem(null)}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-5 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="glass flex flex-col gap-1 rounded-xl p-4">
                  <span className={labelClass}>Red Social</span>
                  <span className="text-sm font-medium capitalize text-[var(--text)]">
                    {viewItem.platform}
                  </span>
                </div>
                <div className="glass flex flex-col gap-1 rounded-xl p-4">
                  <span className={labelClass}>Hora</span>
                  <span className="text-sm font-medium text-[var(--text)]">
                    {viewItem.time}
                  </span>
                </div>
                <div className="glass flex flex-col gap-1 rounded-xl p-4">
                  <span className={labelClass}>Tipo</span>
                  <span className="text-sm font-medium capitalize text-[var(--text)]">
                    {viewItem.type}
                  </span>
                </div>
                <div className="glass flex flex-col gap-1 rounded-xl p-4">
                  <span className={labelClass}>Estado</span>
                  <span className="text-sm font-medium capitalize text-[var(--text)]">
                    {viewItem.status}
                  </span>
                </div>
                {viewItem.url && (
                  <div className="glass col-span-2 flex flex-col gap-1 rounded-xl p-4">
                    <span className={labelClass}>Link de piezas</span>
                    <a
                      href={viewItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-words text-sm font-medium text-[var(--accent)] underline"
                    >
                      {viewItem.url}
                    </a>
                  </div>
                )}
                {viewItem.kpi && (
                  <div className="glass col-span-2 flex flex-col gap-1 rounded-xl p-4">
                    <span className={labelClass}>KPI objetivo</span>
                    <span className="text-sm font-medium text-[var(--text)]">
                      {viewItem.kpi}
                    </span>
                  </div>
                )}
                <div className="glass col-span-2 flex flex-col gap-1 rounded-xl p-4">
                  <span className={labelClass}>Copy del contenido</span>
                  <span className="mt-1 whitespace-pre-wrap break-words text-sm font-medium text-[var(--text)]">
                    {viewItem.description}
                  </span>
                </div>
                {viewItem.comments && (
                  <div className="glass col-span-2 flex flex-col gap-1 rounded-xl border border-amber-500/20 p-4">
                    <span className={labelClass}>Comentarios de publicadores</span>
                    <span className="mt-1 whitespace-pre-wrap break-words text-sm font-medium text-[var(--text)]">
                      {viewItem.comments}
                    </span>
                  </div>
                )}

                {/* Sección de comentarios de visualizadores */}
                <div className="col-span-2 mt-3 flex flex-col gap-4 border-t border-dashed border-white/10 pt-6">
                  <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-[var(--text)]">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-[var(--accent)]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Comentarios y Observaciones
                  </h3>

                  <div className="flex max-h-[240px] flex-col gap-3 overflow-y-auto pr-1">
                    {!viewItem.viewerComments || viewItem.viewerComments.length === 0 ? (
                      <p className="py-2.5 text-center text-sm italic text-[var(--text-faint)]">
                        No hay comentarios aún. ¡Sé el primero en opinar!
                      </p>
                    ) : (
                      viewItem.viewerComments.map((c) => (
                        <div key={c.id} className="glass flex flex-col gap-1.5 rounded-xl p-3.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] font-bold text-[var(--accent)]">
                              {c.name}
                            </span>
                            <span className="font-mono text-[11px] text-[var(--text-faint)]">
                              {c.timestamp}
                            </span>
                          </div>
                          <p className="break-words text-[13px] leading-snug text-[var(--text)]">
                            {c.comment}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Formulario para agregar comentario */}
                  <form
                    onSubmit={handleAddViewerComment}
                    className="glass flex flex-col gap-3 rounded-2xl p-4"
                  >
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>Tu Nombre</label>
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="Quien comenta..."
                        value={viewerCommentName}
                        onChange={(e) => setViewerCommentName(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className={labelClass}>Observación o Comentario</label>
                      <textarea
                        className={`${inputClass} min-h-[60px] resize-y`}
                        placeholder="Escribe aquí tu observación..."
                        value={viewerCommentText}
                        onChange={(e) => setViewerCommentText(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit"
                      className="accent-bg self-end rounded-lg px-4 py-2 text-[13px] font-bold text-black transition hover:neon-glow"
                    >
                      Enviar Comentario
                    </button>
                  </form>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-white/10 p-4">
              <button
                type="button"
                className="glass rounded-xl px-4 py-2.5 text-sm font-bold text-[var(--text-dim)] transition hover:text-[var(--text)]"
                onClick={() => setViewItem(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {itemToDelete && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setItemToDelete(null);
          }}
        >
          <div className="glass-strong w-full max-w-[400px] overflow-hidden rounded-2xl">
            <div className="border-b border-rose-500/30 bg-rose-500/10 p-6">
              <h2 className="text-lg font-extrabold text-rose-300">
                Confirmar eliminación
              </h2>
            </div>
            <div className="p-6">
              <p className="my-5 text-center text-base leading-relaxed text-[var(--text)]">
                ¿Estás seguro de que deseas eliminar esta publicación? <br />
                <strong>
                  Esta acción no se puede deshacer y afectará a todos los usuarios.
                </strong>
              </p>
            </div>
            <div className="flex justify-end gap-3 border-t border-white/10 p-4">
              <button
                type="button"
                className="glass rounded-xl px-4 py-2.5 text-sm font-bold text-[var(--text-dim)] transition hover:text-[var(--text)]"
                onClick={() => setItemToDelete(null)}
              >
                No, cancelar
              </button>
              <button
                type="button"
                className="rounded-xl bg-rose-500/15 px-5 py-2.5 text-sm font-bold text-rose-300 transition hover:bg-rose-500/25"
                onClick={handleDeleteItem}
              >
                Sí, eliminar definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ParrillaView;
