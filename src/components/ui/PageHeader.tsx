import React from "react";
import { Icon } from "./icon";

export function PageHeader({
  title,
  description,
  icon,
  actions,
}: {
  title: string;
  description?: string;
  icon?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon && (
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
          >
            <Icon name={icon} className="h-5.5 w-5.5" />
          </span>
        )}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text)]">{title}</h1>
          {description && <p className="text-sm text-[var(--text-dim)]">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
