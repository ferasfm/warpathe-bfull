CREATE TABLE public.user_confirmations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    station_id uuid NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
    fuel_type public.fuel_type NOT NULL,
    is_available boolean NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    ip_address inet,
    CONSTRAINT user_confirmations_pkey PRIMARY KEY (id)
);

GRANT SELECT, INSERT ON public.user_confirmations TO anon;
GRANT SELECT, INSERT ON public.user_confirmations TO authenticated;
GRANT ALL ON public.user_confirmations TO service_role;

ALTER TABLE public.user_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view confirmations" ON public.user_confirmations
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Anyone can insert confirmations" ON public.user_confirmations
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE INDEX idx_user_confirmations_lookup ON public.user_confirmations(station_id, fuel_type, created_at);
