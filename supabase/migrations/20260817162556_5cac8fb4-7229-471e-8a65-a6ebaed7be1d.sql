-- Standard Security Hardening for SECURITY DEFINER functions in the public schema
-- The linter warns when these functions are executable by PUBLIC (anon + authenticated)

-- 1. has_role
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 2. can_manage_station
REVOKE EXECUTE ON FUNCTION public.can_manage_station(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_manage_station(uuid, uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_station(uuid, uuid) TO authenticated, service_role;

-- 3. get_manager_permission
REVOKE EXECUTE ON FUNCTION public.get_manager_permission(uuid, uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_manager_permission(uuid, uuid, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_manager_permission(uuid, uuid, text) TO authenticated, service_role;

-- 4. log_station_change
-- This is likely a trigger function, only service_role/postgres should run it
REVOKE EXECUTE ON FUNCTION public.log_station_change() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_station_change() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_station_change() TO service_role;

-- 5. handle_new_user
-- This is a trigger function for auth.users, only service_role/postgres should run it
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
