-- 1. Ensure user_roles table is secure and has the has_role function
-- (Re-applying standard pattern to ensure it exists and is correct)

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('super_admin', 'station_manager');
    END IF;
END $$;

-- Enable RLS and set grants for all core tables
-- This ensures compliance with Lovable Cloud security standards

-- STATIONS
GRANT SELECT ON public.stations TO anon, authenticated;
GRANT ALL ON public.stations TO authenticated;
GRANT ALL ON public.stations TO service_role;
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public can view active stations" ON public.stations;
    DROP POLICY IF EXISTS "Admins can manage stations" ON public.stations;
END $$;

CREATE POLICY "Public can view active stations" ON public.stations
    FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can manage stations" ON public.stations
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'));

-- STATION_FUELS
GRANT SELECT ON public.station_fuels TO anon, authenticated;
GRANT ALL ON public.station_fuels TO authenticated;
GRANT ALL ON public.station_fuels TO service_role;
ALTER TABLE public.station_fuels ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public can view fuels" ON public.station_fuels;
    DROP POLICY IF EXISTS "Admins and Managers can update fuels" ON public.station_fuels;
END $$;

CREATE POLICY "Public can view fuels" ON public.station_fuels
    FOR SELECT USING (true);

CREATE POLICY "Admins and Managers can update fuels" ON public.station_fuels
    FOR ALL TO authenticated
    USING (
        public.has_role(auth.uid(), 'super_admin') OR 
        EXISTS (
            SELECT 1 FROM public.manager_group_members m
            JOIN public.manager_group_stations s ON m.group_id = s.group_id
            WHERE m.user_id = auth.uid() AND s.station_id = public.station_fuels.station_id
        )
    );

-- ANNOUNCEMENTS
GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT ALL ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public can view active announcements" ON public.announcements;
    DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
END $$;

CREATE POLICY "Public can view active announcements" ON public.announcements
    FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can manage announcements" ON public.announcements
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'));

-- PROFILES
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
END $$;

CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'));

-- USER_ROLES
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
    DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
END $$;

CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'));

-- MANAGER GROUPS & HIERARCHY
GRANT SELECT ON public.manager_groups TO authenticated;
GRANT ALL ON public.manager_groups TO service_role;
ALTER TABLE public.manager_groups ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.manager_group_members TO authenticated;
GRANT ALL ON public.manager_group_members TO service_role;
ALTER TABLE public.manager_group_members ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.manager_group_stations TO authenticated;
GRANT ALL ON public.manager_group_stations TO service_role;
ALTER TABLE public.manager_group_stations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Admins manage groups" ON public.manager_groups;
    DROP POLICY IF EXISTS "Admins manage group members" ON public.manager_group_members;
    DROP POLICY IF EXISTS "Admins manage group stations" ON public.manager_group_stations;
END $$;

CREATE POLICY "Admins manage groups" ON public.manager_groups FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins manage group members" ON public.manager_group_members FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "Admins manage group stations" ON public.manager_group_stations FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
