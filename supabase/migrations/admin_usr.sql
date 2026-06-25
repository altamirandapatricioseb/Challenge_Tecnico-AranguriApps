-- ============================================================
-- — Vista de administración de usuarios
-- ============================================================

CREATE OR REPLACE VIEW admin_users_overview
WITH (security_invoker = true)
AS
SELECT
  p.id,
  u.email,
  p.full_name,
  p.role,
  p.created_at
FROM profiles p
JOIN auth.users u ON u.id = p.id
ORDER BY p.created_at DESC;