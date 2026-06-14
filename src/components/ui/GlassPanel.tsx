import React from "react";
import { cn } from "@/lib/utils";

/** Tarjeta de vidrio reutilizable del design system. */
export function GlassPanel({
  className,
  children,
  glow = false,
  strong = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { glow?: boolean; strong?: boolean }) {
  return (
    <div
      className={cn(
        strong ? "glass-strong" : "glass",
        glow && "neon-glow",
        "p-5 transition-all duration-300",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
