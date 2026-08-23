-- Revoke EXECUTE on security definer functions from public and authenticated roles
-- Use parameter names as defined in the DB to avoid signature mismatch

REVOKE EXECUTE ON FUNCTION public.process_agent_event() FROM public, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.process_agent_event() TO service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) FROM public, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_user_role(_user_id uuid) FROM public, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(_user_id uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.check_ip_blocked(_ip text) FROM public, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_ip_blocked(_ip text) TO authenticated, service_role;
