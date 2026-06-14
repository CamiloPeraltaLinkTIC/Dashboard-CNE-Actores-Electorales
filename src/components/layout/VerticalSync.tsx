"use client";

import { useEffect } from "react";
import { useVertical } from "@/context/VerticalContext";
import type { VerticalId } from "@/lib/verticals";

/** Al entrar a una ruta de un vertical, alinea el estado global con esa ruta. */
export function VerticalSync({ id }: { id: VerticalId }) {
  const { syncVertical } = useVertical();
  useEffect(() => {
    syncVertical(id);
  }, [id, syncVertical]);
  return null;
}
