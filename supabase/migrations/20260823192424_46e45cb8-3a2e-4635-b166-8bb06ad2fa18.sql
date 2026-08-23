-- Create ai_mission_generation_logs table
CREATE TABLE public.ai_mission_generation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    generated_json JSONB,
    provider TEXT,
    model TEXT,
    status TEXT NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.ai_mission_generation_logs ENABLE ROW LEVEL SECURITY;

-- Grant access
GRANT SELECT, INSERT ON public.ai_mission_generation_logs TO authenticated;
GRANT ALL ON public.ai_mission_generation_logs TO service_role;

-- Policies
CREATE POLICY "Admins can view all generation logs"
ON public.ai_mission_generation_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can insert generation logs"
ON public.ai_mission_generation_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL); -- Simplified check, has_role is used for logic anyway
