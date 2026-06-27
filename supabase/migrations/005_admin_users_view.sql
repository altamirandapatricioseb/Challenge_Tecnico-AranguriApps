-- ============================================================
-- MIGRACION 005 — Vista de administracion de usuarios
-- ============================================================
-- Funcion get_user_email() (SECURITY DEFINER) que lee el email de auth.users,
-- y la vista admin_users_overview que combina profiles con ese email.
-- Necesario porque los usuarios no pueden leer auth.users directamente.
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_email(user_id UUID)
RETURNS TEXT AS $$
  SELECT email FROM auth.users WHERE id = user_id
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Vista de administracion: lee de profiles (que tiene RLS) y trae el email
-- via la funcion. security_invoker = true para respetar las policies de profiles.
CREATE OR REPLACE VIEW admin_users_overview
WITH (security_invoker = true)
AS
SELECT
  p.id,
  get_user_email(p.id) AS email,
  p.full_name,
  p.role,
  p.created_at
FROM profiles p
ORDER BY p.created_at DESC;
