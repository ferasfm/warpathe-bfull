-- Initialize AI Mission Builder settings
INSERT INTO public.system_settings (key, value, description)
VALUES 
    ('AI_MISSION_BUILDER_PROVIDER', '"lovable"', 'Provider for AI Mission Builder (lovable, openai, anthropic)'),
    ('AI_MISSION_BUILDER_MODEL', '"gpt-4o"', 'Model for AI Mission Builder'),
    ('AI_MISSION_BUILDER_TIMEOUT_MS', '60000', 'Timeout for AI Mission Builder requests in milliseconds')
ON CONFLICT (key) DO NOTHING;
