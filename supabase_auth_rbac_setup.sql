-- ============================================================================
-- RBAC del Dashboard Unificado — Supabase Auth + roles + acceso por pantalla
-- Ejecutar en el SQL Editor del proyecto Supabase de `estrategia`.
--
-- Idempotente: se puede correr varias veces. Integra con el esquema de la
-- referencia (cne-tablero-narrativa): tabla `profiles` + trigger `handle_new_user`.
-- Añade el rol `superadmin` y el acceso por pantalla por usuario.
-- ============================================================================

-- 1) Tabla de perfiles (1:1 con auth.users). Crear si no existe.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  user_role TEXT DEFAULT 'reader',
  full_name TEXT
);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 2) Roles permitidos. Se admiten superadmin/admin/viewer y los legados
--    reader/user (reader se trata como viewer en la app).
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_role_check
  CHECK (user_role IN ('superadmin', 'admin', 'viewer', 'reader', 'user'));

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3) Helpers de rol (SECURITY DEFINER → saltan RLS al leer profiles).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND user_role IN ('admin', 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND user_role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) Trigger: al crear un usuario en auth.users, crea su perfil (rol por defecto
--    'reader'; el superadmin lo promueve después).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_role, full_name)
  VALUES (
    new.id,
    'reader',
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'username')
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5) RLS de profiles: cada quien lee su perfil; el superadmin lee/gestiona todos.
DROP POLICY IF EXISTS "perfil propio lectura" ON public.profiles;
CREATE POLICY "perfil propio lectura"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_superadmin());

DROP POLICY IF EXISTS "superadmin gestiona perfiles" ON public.profiles;
CREATE POLICY "superadmin gestiona perfiles"
  ON public.profiles FOR ALL TO authenticated
  USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- 6) Acceso por pantalla, por usuario. screen_key = path del módulo (verticals.ts),
--    p.ej. '/ae/analytics', '/shared/soporte'. Un superadmin ve todo (no requiere
--    filas aquí). admin/viewer solo ven las pantallas listadas.
CREATE TABLE IF NOT EXISTS public.user_screen_access (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  screen_key TEXT NOT NULL,
  PRIMARY KEY (user_id, screen_key)
);
ALTER TABLE public.user_screen_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "acceso propio lectura" ON public.user_screen_access;
CREATE POLICY "acceso propio lectura"
  ON public.user_screen_access FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_superadmin());

DROP POLICY IF EXISTS "superadmin gestiona accesos" ON public.user_screen_access;
CREATE POLICY "superadmin gestiona accesos"
  ON public.user_screen_access FOR ALL TO authenticated
  USING (public.is_superadmin()) WITH CHECK (public.is_superadmin());

-- 7) Sembrar el primer superadmin (ajustar el email de un usuario ya creado):
-- UPDATE public.profiles p SET user_role = 'superadmin'
--   FROM auth.users u WHERE u.id = p.id AND u.email = 'superadmin@yopmail.com';
