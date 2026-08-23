-- Retention settings in system_settings
INSERT INTO public.system_settings (key, value, description)
VALUES 
  ('LOG_RETENTION_DAYS', '30', 'Number of days to keep general logs'),
  ('MISSION_RUN_RETENTION_DAYS', '90', 'Number of days to keep mission run history'),
  ('VISION_LOG_RETENTION_DAYS', '7', 'Number of days to keep vision screenshots and results')
ON CONFLICT (key) DO UPDATE SET description = EXCLUDED.description;

-- Add monitoring columns to mission_runs
ALTER TABLE public.mission_runs ADD COLUMN IF NOT EXISTS current_step_index INT DEFAULT 0;
ALTER TABLE public.mission_runs ADD COLUMN IF NOT EXISTS total_steps INT DEFAULT 0;
ALTER TABLE public.mission_runs ADD COLUMN IF NOT EXISTS last_event_type TEXT;
ALTER TABLE public.mission_runs ADD COLUMN IF NOT EXISTS recovery_count INT DEFAULT 0;

-- Create mission_events table for detailed timeline
CREATE TABLE IF NOT EXISTS public.mission_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_run_id UUID REFERENCES public.mission_runs(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'INFO',
    message TEXT,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

GRANT SELECT, INSERT ON public.mission_events TO authenticated;
GRANT ALL ON public.mission_events TO service_role;

ALTER TABLE public.mission_events ENABLE ROW LEVEL SECURITY;

-- Correct RLS for mission_events using farm_users for ownership check
CREATE POLICY "Users can view events for their own mission runs"
ON public.mission_events
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.mission_runs mr
        JOIN public.farm_users fu ON mr.farm_id = fu.farm_id
        WHERE mr.id = mission_events.mission_run_id
        AND (fu.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mission_events_run_id ON public.mission_events(mission_run_id);
CREATE INDEX IF NOT EXISTS idx_mission_events_created_at ON public.mission_events(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_events_type ON public.agent_events(event_type);
CREATE INDEX IF NOT EXISTS idx_agent_events_agent_id ON public.agent_events(agent_id);
