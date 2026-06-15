"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

/**
 * Anima la entrada del contenido en cada cambio de ruta (incluye el cambio de
 * vertical CNE <-> AE). Es un motion.div con `key={pathname}` SIN animación de
 * salida: al cambiar la ruta se re-monta y hace fade + slide-up. Evitamos
 * AnimatePresence/exit porque en el App Router el contenido ya es el nuevo
 * cuando cambia el pathname, y la salida dejaba un hueco vacío.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
