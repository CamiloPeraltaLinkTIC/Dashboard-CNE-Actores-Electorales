import React from "react";
import { cn } from "@/lib/utils";

/** Bloque de carga con shimmer de vidrio (usa la clase .skeleton de globals.css). */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

/** Rejilla de tarjetas-skeleton para estados de carga de un módulo. */
export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full" />
      ))}
    </div>
  );
}
