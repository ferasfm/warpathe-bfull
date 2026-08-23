-- 1. Create vision_results table for telemetry
CREATE TABLE IF NOT EXISTS public.vision_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id uuid REFERENCES public.devices(id),
    emulator_id uuid REFERENCES public.emulators(id),
    rule_id uuid REFERENCES public.vision_rules(id),
    detected boolean NOT NULL,
    confidence float NOT NULL,
    matches jsonb DEFAULT '[]'::jsonb,
    screenshot_width integer,
    screenshot_height integer,
    processing_time_ms integer,
    created_at timestamptz DEFAULT now()
);

-- 2. Grant permissions
GRANT SELECT, INSERT ON public.vision_results TO authenticated;
GRANT ALL ON public.vision_results TO service_role;

-- 3. Enable RLS
ALTER TABLE public.vision_results ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "Admins can view all vision results" ON public.vision_results;
CREATE POLICY "Admins can view all vision results"
ON public.vision_results
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fixed version using public.farm_users properly
DROP POLICY IF EXISTS "Users can view vision results for their farms" ON public.vision_results;
CREATE POLICY "Users can view vision results for their farms"
ON public.vision_results
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.farm_users fu
        JOIN public.farms f ON f.id = fu.farm_id
        LEFT JOIN public.devices d ON d.agent_id IN (SELECT agent_id FROM public.devices WHERE id = vision_results.device_id)
        LEFT JOIN public.emulators e ON e.agent_id IN (SELECT agent_id FROM public.emulators WHERE id = vision_results.emulator_id)
        WHERE fu.user_id = auth.uid()
        -- Note: simplified check, assuming farm owns agent or similar linkage
        -- For now, let's just use a direct farm check if possible
    )
);

-- Simpler check for now: if user belongs to the farm that owns the device/emulator
-- But wait, devices/emulators tables don't have farm_id in the types?
-- Re-checking types: devices has agent_id. emulators has agent_id and assigned_farm_id.

DROP POLICY IF EXISTS "Users can view vision results for their farms" ON public.vision_results;
CREATE POLICY "Users can view vision results for their farms"
ON public.vision_results
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.farm_users fu
        LEFT JOIN public.emulators e ON e.assigned_farm_id = fu.farm_id
        WHERE fu.user_id = auth.uid()
        AND vision_results.emulator_id = e.id
    )
);
