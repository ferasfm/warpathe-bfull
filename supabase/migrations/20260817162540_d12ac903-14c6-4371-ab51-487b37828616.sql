-- Secure all public functions based on the discovered list

-- 1. has_role (already partially secured, but ensuring standard)
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 2. can_manage_station
ALTER FUNCTION public.can_manage_station(uuid, uuid) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.can_manage_station(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_station(uuid, uuid) TO authenticated, service_role;

-- 3. get_manager_permission
ALTER FUNCTION public.get_manager_permission(uuid, uuid, text) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.get_manager_permission(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_manager_permission(uuid, uuid, text) TO authenticated, service_role;

-- 4. log_station_change
ALTER FUNCTION public.log_station_change() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.log_station_change() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_station_change() TO authenticated, service_role;

-- 5. handle_new_user
ALTER FUNCTION public.handle_new_user() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, service_role;

-- 6. set_updated_at
ALTER FUNCTION public.set_updated_at() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO authenticated, service_role;
