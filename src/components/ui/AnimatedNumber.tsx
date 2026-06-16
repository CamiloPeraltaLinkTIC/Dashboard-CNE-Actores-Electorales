"use client";

import React, { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";

/**
 * Convierte una cadena a número respetando el separador decimal (es-CO usa coma,
 * en-US usa punto). Detecta cuál es el decimal por la posición del último
 * separador, para no inflar el valor (p.ej. "45,2" -> 45.2, no 452).
 */
function parseNum(s: string): number {
  const cleaned = s.replace(/[^0-9.,-]/g, "");
  if (!/[0-9]/.test(cleaned)) return NaN;
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");
  let normalized = cleaned;
  if (hasComma && hasDot) {
    // El separador decimal es el que aparece más a la derecha; el otro es de miles.
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = cleaned.replace(/,/g, "");
    }
  } else if (hasComma) {
    // Varias comas => separadores de miles; una sola => decimal (es-CO).
    normalized = cleaned.split(",").length > 2 ? cleaned.replace(/,/g, "") : cleaned.replace(",", ".");
  }
  return Number(normalized);
}

/**
 * Cuenta de 0 hasta el valor cuando entra en viewport.
 * - Nunca muestra una cifra mayor que el objetivo (clamp).
 * - Al terminar muestra el valor EXACTO de origen (cadena verbatim / número con
 *   formato), de modo que el resultado final siempre es fiel al dato.
 * - Si el valor no es numérico, lo renderiza tal cual.
 */
export function AnimatedNumber({
  value,
  duration = 1.1,
  format,
  className,
}: {
  value: number | string;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  const target = typeof value === "number" ? value : parseNum(String(value));
  const isNumeric = Number.isFinite(target);

  const [display, setDisplay] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!isNumeric || !inView) return;
    setAnimating(true);
    const controls = animate(0, target, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
      onComplete: () => setAnimating(false),
    });
    return () => controls.stop();
  }, [inView, target, isNumeric, duration]);

  if (!isNumeric) {
    return (
      <span ref={ref} className={className}>
        {value}
      </span>
    );
  }

  if (animating) {
    // Nunca por encima del objetivo.
    const clamped = target >= 0 ? Math.min(display, target) : Math.max(display, target);
    // Si el objetivo es entero, evita el parpadeo de decimales durante la cuenta.
    const shown = Number.isInteger(target) ? Math.round(clamped) : clamped;
    const out = format ? format(shown) : Math.round(shown).toLocaleString("es-CO");
    return (
      <span ref={ref} className={className}>
        {out}
      </span>
    );
  }

  // En reposo (antes de animar o ya terminado): aplica el MISMO formato que durante
  // la animación, para que los separadores de miles no desaparezcan al terminar.
  // (En este punto `target` siempre es finito porque el caso no-numérico ya retornó.)
  const rest = format ? format(target) : target.toLocaleString("es-CO");
  return (
    <span ref={ref} className={className}>
      {rest}
    </span>
  );
}
