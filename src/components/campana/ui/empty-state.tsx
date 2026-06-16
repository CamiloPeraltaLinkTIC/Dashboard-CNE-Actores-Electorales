import Link from "next/link";

export function EmptyState({
  title = "Aún no hay datos de pauta",
  description = "Importa tu archivo de pauta (.xlsx) para poblar el dashboard.",
  ctaHref = "/pauta/importar",
  ctaLabel = "Importar Excel",
}: {
  title?: string;
  description?: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-3xl glass"
        style={{ color: "var(--accent)" }}>
        ◎
      </div>
      <h2 className="mt-5 text-lg font-bold text-[var(--text)]">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-[var(--text-dim)]">{description}</p>
      <Link
        href={ctaHref}
        className="mt-6 rounded-xl px-5 py-2.5 text-sm font-bold text-black shadow-sm transition accent-bg hover:neon-glow"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
