"use client";

import React, { useState } from "react";
import { X, ZoomIn, Activity } from "lucide-react";

/* ── Lightbox overlay ─────────────────────────────────────────────────── */
function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-[90vw] max-h-[90vh] glass-strong rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="block max-w-[88vw] max-h-[88vh] object-contain" />
      </div>
    </div>
  );
}

/* ── ImageFrame — contenedor clicable con zoom hover ─────────────────── */
export function ImageFrame({
  src, alt, height = "h-full", emptyText = "No hay captura disponible",
}: {
  src?: string | null;
  alt: string;
  height?: string;
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className={`relative w-full ${height} bg-white/5 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center group ${src ? "cursor-zoom-in" : ""}`}
        onClick={() => src && setOpen(true)}
      >
        {src ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <ZoomIn className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
          </>
        ) : (
          <div className="text-[var(--text-dim)] flex flex-col items-center gap-2">
            <Activity className="w-8 h-8 opacity-30" />
            <span className="text-sm font-medium text-center">{emptyText}</span>
          </div>
        )}
      </div>
      {open && src && <ImageLightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
}
