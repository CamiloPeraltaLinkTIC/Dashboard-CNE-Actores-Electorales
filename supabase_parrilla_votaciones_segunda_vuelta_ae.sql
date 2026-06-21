-- ============================================================================
-- Parrilla de contenidos: "Presidenciales Segunda Vuelta" · Actores Electorales
-- Ejecutar en el SQL Editor del proyecto Supabase de `analytics`.
--
-- Misma estructura que las demás parrillas (parrilla_presidenciales_ae, etc.).
-- La grilla se consume desde el navegador con la ANON KEY (lecturas, inserts,
-- updates, deletes y realtime), por eso RLS queda habilitado CON políticas
-- públicas y la tabla se agrega a la publicación de realtime.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tabla
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.parrilla_votaciones_segunda_vuelta_ae (
  id              TEXT PRIMARY KEY,          -- id del ítem (timestamp/aleatorio) o 'default' (legacy)
  time            TEXT,                      -- "HH:MM"
  platform        TEXT,                      -- 'facebook' | 'instagram' | 'tiktok' | 'x'
  type            TEXT,                      -- post | reel | Story | Trino | ...
  description     TEXT,
  status          TEXT,                      -- Publicado | Programado | ...
  duration        INTEGER DEFAULT 60,        -- minutos
  url             TEXT,
  comments        TEXT,
  kpi             TEXT,
  viewer_comments JSONB DEFAULT '[]'::jsonb, -- comentarios de visualizadores
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- RLS: políticas públicas (anon + authenticated) para SELECT/INSERT/UPDATE/DELETE.
-- ----------------------------------------------------------------------------
ALTER TABLE public.parrilla_votaciones_segunda_vuelta_ae ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "parrilla_vsv_ae_all"
  ON public.parrilla_votaciones_segunda_vuelta_ae;

CREATE POLICY "parrilla_vsv_ae_all"
  ON public.parrilla_votaciones_segunda_vuelta_ae
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- Realtime: agregar la tabla a la publicación (idempotente).
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime
    ADD TABLE public.parrilla_votaciones_segunda_vuelta_ae;
EXCEPTION
  WHEN duplicate_object THEN NULL;  -- ya estaba agregada
END $$;
