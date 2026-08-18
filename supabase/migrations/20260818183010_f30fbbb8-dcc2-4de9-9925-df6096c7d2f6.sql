ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.station_fuels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active stations" ON public.stations;
CREATE POLICY "Public can view active stations" ON public.stations
FOR SELECT TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Public can view fuels" ON public.station_fuels;
CREATE POLICY "Public can view fuels" ON public.station_fuels
FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public can view announcements" ON public.announcements;
CREATE POLICY "Public can view announcements" ON public.announcements
FOR SELECT TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Public can view site settings" ON public.site_settings;
CREATE POLICY "Public can view site settings" ON public.site_settings
FOR SELECT TO anon, authenticated
USING (true);
