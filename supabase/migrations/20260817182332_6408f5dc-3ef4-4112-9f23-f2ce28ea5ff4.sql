-- Revoke public execution of check_ip_blocked
REVOKE EXECUTE ON FUNCTION public.check_ip_blocked(TEXT) FROM public, anon, authenticated;

-- Grant execution only to service_role (since we call it from a server function using supabaseAdmin)
GRANT EXECUTE ON FUNCTION public.check_ip_blocked(TEXT) TO service_role;

-- Also fix other security definer functions found by linter if any
-- The linter mentioned 4 warnings, likely including has_role
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO service_role;
