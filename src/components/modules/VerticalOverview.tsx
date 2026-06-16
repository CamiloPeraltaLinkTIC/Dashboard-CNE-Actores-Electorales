"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { VERTICALS, SHARED_MODULES, type VerticalId } from "@/lib/verticals";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/icon";
import { useLayout } from "@/context/LayoutContext";

export function VerticalOverview({ id }: { id: VerticalId }) {
  const v = VERTICALS[id];
  const { role, allowedScreens } = useLayout();

  // Solo se muestran las pantallas a las que el usuario tiene acceso (superadmin ve todo).
  const allModules = [...v.modules, ...SHARED_MODULES];
  const modules =
    role === "superadmin"
      ? allModules
      : allModules.filter((m) => allowedScreens.includes(m.path));

  return (
    <div>
      <PageHeader
        title={v.label}
        description={v.description}
        icon={v.icon}
      />

      {/* Grid de módulos */}
      <h2 className="mb-3 mt-2 text-xs font-black uppercase tracking-widest text-[var(--text-faint)]">
        Módulos del vertical
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((m, i) => (
          <motion.div
            key={m.path}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: i * 0.05 }}
            whileHover={{ y: -4 }}
          >
            <Link href={m.path} className="group block h-full">
              <GlassPanel className="h-full transition-all group-hover:neon-border">
              <div className="flex items-start justify-between">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
                >
                  <Icon name={m.icon} className="h-5.5 w-5.5" />
                </span>
                <ArrowUpRight className="h-4.5 w-4.5 text-[var(--text-faint)] transition-colors group-hover:text-[var(--accent)]" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[var(--text)]">{m.title}</h3>
              <p className="mt-1 text-sm text-[var(--text-dim)]">{m.description}</p>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-faint)]">
                  {m.db}
                </p>
              </GlassPanel>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
