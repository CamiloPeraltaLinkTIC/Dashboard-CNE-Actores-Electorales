"use client";

import { useFormStatus } from "react-dom";

export function SaveButton({
  children = "Guardar",
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-xl accent-bg px-4 py-2.5 text-sm font-bold text-black shadow-sm transition hover:neon-glow disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {pending ? "Guardando…" : children}
    </button>
  );
}
