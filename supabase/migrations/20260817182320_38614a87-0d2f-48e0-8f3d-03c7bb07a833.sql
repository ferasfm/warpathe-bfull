-- Create login_attempts table
CREATE TABLE public.login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT NOT NULL,
    attempt_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_successful BOOLEAN DEFAULT false
);

-- Grant access
GRANT INSERT ON public.login_attempts TO anon, authenticated;
GRANT SELECT ON public.login_attempts TO authenticated;
GRANT ALL ON public.login_attempts TO service_role;

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can insert login attempts"
    ON public.login_attempts FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Admins can view all login attempts"
    ON public.login_attempts FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'super_admin'));

-- Function to check if IP is blocked
CREATE OR REPLACE FUNCTION public.check_ip_blocked(_ip TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.login_attempts
        WHERE ip_address = _ip
          AND is_successful = false
          AND attempt_time > now() - interval '24 hours'
        HAVING count(*) >= 3
    );
$$;

-- Grant execute on the function
GRANT EXECUTE ON FUNCTION public.check_ip_blocked(TEXT) TO anon, authenticated;
