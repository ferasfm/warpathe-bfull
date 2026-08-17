REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_manage_station(uuid, uuid) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_manager_permission(uuid, uuid, text) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_ip_blocked(text) FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_station_change() FROM public, anon, authenticated;

-- Grant to service_role so server functions can still use them
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_station(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_manager_permission(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_ip_blocked(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.log_station_change() TO service_role;
