"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLayout } from "@/context/LayoutContext";
import { isPathAllowed } from "@/lib/auth/rbac";

/**
 * Mantiene el rol y las pantallas del usuario al día SIN cerrar sesión.
 *
 * Sondea `/api/me` periódicamente (y al volver el foco a la pestaña). Si el rol o
 * las pantallas cambiaron respecto al render actual, llama a `router.refresh()`:
 * eso re-ejecuta el layout SSR (que re-lee el acceso y re-gatea la ruta) y
 * actualiza el menú/overview. Si el usuario quedó sin acceso a la pantalla
 * actual, el middleware lo redirige al refrescar.
 */
export function AccessSync() {
  const { role, allowedScreens } = useLayout();
  const router = useRouter();
  const pathname = usePathname();
  const sigRef = useRef("");

  useEffect(() => {
    sigRef.current = `${role}|${[...allowedScreens].sort().join(",")}`;
  }, [role, allowedScreens]);

  // Guard de ruta en cliente: si el usuario está (o navega) a una pantalla no
  // permitida, lo saca al inicio. Corre en cada cambio de ruta y al montar, así
  // cubre la navegación por click Y por URL directa (independiente del middleware).
  useEffect(() => {
    if (!isPathAllowed({ role, screens: allowedScreens }, pathname)) {
      router.replace("/");
    }
  }, [pathname, role, allowedScreens, router]);

  useEffect(() => {
    let active = true;

    const check = async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (!res.ok) {
          if (res.status === 401) router.refresh(); // sesión perdida → al login
          return;
        }
        const data = await res.json();
        const sig = `${data.role}|${[...(data.screens ?? [])].sort().join(",")}`;
        if (active && sig !== sigRef.current) {
          sigRef.current = sig;
          router.refresh();
        }
      } catch {
        /* red intermitente: se reintenta en el próximo tick */
      }
    };

    const id = setInterval(check, 30000);
    const onFocus = () => {
      if (document.visibilityState !== "hidden") check();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      active = false;
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [router]);

  return null;
}
