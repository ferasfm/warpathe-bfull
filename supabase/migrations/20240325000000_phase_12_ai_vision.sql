-- Phase 12: AI Vision Fallback

-- 1. Create AI Vision Logs table
CREATE TABLE public.ai_vision_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    device_id TEXT, -- ADB serial
    mission_run_id UUID REFERENCES public.mission_runs(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt TEXT,
    result JSONB,
    confidence FLOAT,
    processing_time_ms INTEGER,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add grants
GRANT SELECT, INSERT ON public.ai_vision_logs TO authenticated;
GRANT ALL ON public.ai_vision_logs TO service_role;

-- 3. Enable RLS
ALTER TABLE public.ai_vision_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy
CREATE POLICY "Admins can view all AI vision logs"
    ON public.ai_vision_logs
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 5. System Settings for AI Vision
-- Default configurations
INSERT INTO public.system_settings (key, value, description)
VALUES 
('AI_VISION_ENABLED', 'false', 'Enable/Disable AI Vision fallback global toggle'),
('AI_VISION_PROVIDER', '"lovable"', 'AI Vision provider (lovable, openai, anthropic)'),
('AI_VISION_MODEL', '"gpt-4o"', 'AI Vision model identifier'),
('AI_VISION_CONFIDENCE_THRESHOLD', '0.7', 'Minimum confidence score for AI Vision results'),
('AI_VISION_TIMEOUT_MS', '30000', 'Timeout for AI Vision calls'),
('AI_VISION_MAX_CALLS_PER_MISSION', '10', 'Maximum AI calls allowed per mission run'),
('AI_VISION_MAX_CALLS_PER_DEVICE_HOUR', '50', 'Maximum AI calls allowed per device per hour');

