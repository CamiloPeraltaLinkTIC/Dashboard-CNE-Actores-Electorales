-- ============================================================================
-- Tokens de Hootsuite (refresh tokens ROTATIVOS de un solo uso).
-- Ejecutar en el SQL Editor del proyecto Supabase de `estrategia`.
--
-- Hootsuite devuelve un nuevo refresh token en cada renovación e invalida el
-- anterior, así que hay que persistirlo. Solo el service-role (servidor) accede:
-- RLS habilitado SIN políticas públicas.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.hootsuite_tokens (
  account TEXT PRIMARY KEY,            -- 'cne' | 'actores'
  refresh_token TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.hootsuite_tokens ENABLE ROW LEVEL SECURITY;
-- Sin políticas: anon/authenticated no pueden leer ni escribir; el service-role
-- (usado solo desde el servidor) salta RLS.
