
-- Revoke all execute privileges from public and anon for functions in public schema
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM public, anon, authenticated;

-- Re-grant to authenticated/service_role as needed
-- has_role is used in RLS, so it needs execute for authenticated
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_ip_blocked(text) TO authenticated, service_role;

-- ensure_first_user_is_super_admin should be service_role only
GRANT EXECUTE ON FUNCTION public.ensure_first_user_is_super_admin() TO service_role;
