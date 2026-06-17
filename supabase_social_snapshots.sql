-- ============================================================================
-- Snapshots diarios de métricas sociales (para calcular "nuevos seguidores /
-- nuevas publicaciones"). Ejecutar en el SQL Editor de Supabase (estrategia).
--
-- Una fila por cuenta y día. Solo el service-role (servidor) accede:
-- RLS habilitado SIN políticas públicas.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.social_metrics_snapshots (
  account_id TEXT NOT NULL,           -- id del perfil en Hootsuite
  network TEXT,
  day DATE NOT NULL,
  followers BIGINT,
  posts BIGINT,
  views BIGINT,
  captured_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (account_id, day)
);

ALTER TABLE public.social_metrics_snapshots ENABLE ROW LEVEL SECURITY;
-- Sin políticas: anon/authenticated no acceden; el service-role salta RLS.
