import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-[var(--text)]">{title}</h1>
        {description && <p className="mt-1 text-sm font-medium text-[var(--text-dim)]">{description}</p>}
      </div>
      {action}
    </div>
  );
}
