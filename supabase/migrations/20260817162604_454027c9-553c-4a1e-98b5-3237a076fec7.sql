-- Final security hardening: Revoke authenticated execute on security definer functions
-- These functions are used in RLS policies, they don't necessarily need to be callable by the user directly via API.

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.can_manage_station(uuid, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_manager_permission(uuid, uuid, text) FROM authenticated;

-- Ensure service_role can still run them for server functions/logic
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_station(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_manager_permission(uuid, uuid, text) TO service_role;
