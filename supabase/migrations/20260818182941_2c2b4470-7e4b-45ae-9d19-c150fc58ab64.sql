GRANT SELECT ON public.stations TO anon, authenticated;
GRANT SELECT ON public.station_fuels TO anon, authenticated;
GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT SELECT ON public.site_settings TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_station(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_ip_blocked(text) TO anon, authenticated;
