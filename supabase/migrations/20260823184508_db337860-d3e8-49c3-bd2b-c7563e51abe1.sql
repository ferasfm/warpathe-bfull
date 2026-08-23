
-- Add authentication and registration fields to agents table
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS token_hash TEXT,
ADD COLUMN IF NOT EXISTS installation_id TEXT UNIQUE;

-- Add registration key to system settings
INSERT INTO public.system_settings (key, value, description, is_sensitive, is_enabled)
VALUES ('AGENT_REGISTRATION_KEY', '"warpath-secret-key-change-me"', 'Secret key required for new agents to register', true, true)
ON CONFLICT (key) DO NOTHING;

-- Ensure grants for service_role (which we'll use in server functions/routes)
GRANT ALL ON public.agents TO service_role;
GRANT ALL ON public.agent_commands TO service_role;
GRANT ALL ON public.agent_events TO service_role;
GRANT ALL ON public.devices TO service_role;
GRANT ALL ON public.emulators TO service_role;

-- We don't want agents to have direct SQL access, so we'll use server-side verification.
GRANT SELECT ON public.agents TO authenticated;
GRANT SELECT ON public.agent_commands TO authenticated;
GRANT SELECT ON public.agent_events TO authenticated;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agents_installation_id ON public.agents(installation_id);
CREATE INDEX IF NOT EXISTS idx_agent_commands_agent_id_status ON public.agent_commands(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_events_agent_id ON public.agent_events(agent_id);
