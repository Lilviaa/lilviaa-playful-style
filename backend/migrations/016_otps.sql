-- Create password_reset_otps table

CREATE TABLE IF NOT EXISTS public.password_reset_otps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    used BOOLEAN DEFAULT false NOT NULL
);

-- Index for quick lookups by email
CREATE INDEX IF NOT EXISTS idx_password_reset_otps_email ON public.password_reset_otps (email);

-- Ensure RLS is enabled but restrict access to service role only
ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to otps" 
    ON public.password_reset_otps 
    FOR ALL 
    USING (auth.jwt() ->> 'role' = 'service_role');
