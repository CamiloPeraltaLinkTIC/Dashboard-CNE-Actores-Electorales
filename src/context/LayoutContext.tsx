"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { AppRole } from "@/lib/auth/rbac";

interface LayoutContextType {
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  /** Rol normalizado real de la app (superadmin | admin | viewer). */
  role: AppRole;
  /** Compat para el código existente: colapsa `superadmin` → `admin`, de modo que
   *  los checks legacy (`userRole === 'admin'` / `=== 'viewer'`) tratan al
   *  superadmin como editor sin necesidad de modificarlos. */
  userRole: AppRole;
  /** Paths de módulo permitidos (vacío = sin acceso a módulos; superadmin ve todo). */
  allowedScreens: string[];
  /** Nombre visible y correo del usuario autenticado. */
  userName: string;
  email: string;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({
  children,
  role = "viewer",
  allowedScreens = [],
  userName = "",
  email = "",
}: {
  children: React.ReactNode;
  role?: AppRole;
  allowedScreens?: string[];
  userName?: string;
  email?: string;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handle = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handle);
    return () => document.removeEventListener("fullscreenchange", handle);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  return (
    <LayoutContext.Provider
      value={{
        isSidebarOpen,
        setSidebarOpen,
        isFullscreen,
        toggleFullscreen,
        role,
        userRole: role === "superadmin" ? "admin" : role,
        allowedScreens,
        userName,
        email,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useLayout debe usarse dentro de LayoutProvider");
  return ctx;
}
