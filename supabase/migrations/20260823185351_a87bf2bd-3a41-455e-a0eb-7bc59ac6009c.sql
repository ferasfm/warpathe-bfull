-- Final security cleanup: ensure all SECURITY DEFINER functions have restricted access
-- Revoking from PUBLIC covers both anon and authenticated

REVOKE EXECUTE ON FUNCTION public.process_agent_event() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_agent_event() TO service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.check_ip_blocked(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_ip_blocked(text) TO authenticated, service_role;
