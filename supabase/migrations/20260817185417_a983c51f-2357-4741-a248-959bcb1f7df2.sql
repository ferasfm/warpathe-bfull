
-- Step 1: Fix Permissions for Functions with correct signatures
GRANT EXECUTE ON FUNCTION public.has_role(_user_id uuid, _role public.app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_station(_user_id uuid, _station_id uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_manager_permission(_user_id uuid, _station_id uuid, _perm text) TO authenticated, anon;

-- Step 2: Ensure SELECT access on core tables for all users
GRANT SELECT ON public.stations TO anon, authenticated;
GRANT SELECT ON public.station_fuels TO anon, authenticated;
GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT SELECT ON public.site_settings TO anon, authenticated;

-- Step 3: Ensure RLS policies exist and are permissive for viewing
DO $$ 
BEGIN
    -- Stations
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stations' AND policyname = 'Stations are viewable by everyone') THEN
        CREATE POLICY "Stations are viewable by everyone" ON public.stations FOR SELECT USING (true);
    END IF;

    -- Station Fuels
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'station_fuels' AND policyname = 'Station fuels are viewable by everyone') THEN
        CREATE POLICY "Station fuels are viewable by everyone" ON public.station_fuels FOR SELECT USING (true);
    END IF;

    -- Announcements
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'announcements' AND policyname = 'Announcements are viewable by everyone') THEN
        CREATE POLICY "Announcements are viewable by everyone" ON public.announcements FOR SELECT USING (true);
    END IF;

    -- Site Settings
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'site_settings' AND policyname = 'Site settings are viewable by everyone') THEN
        CREATE POLICY "Site settings are viewable by everyone" ON public.site_settings FOR SELECT USING (true);
    END IF;
END $$;
