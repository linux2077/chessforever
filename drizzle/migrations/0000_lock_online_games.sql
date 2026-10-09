DROP POLICY IF EXISTS "Anyone can create online games" ON public.online_games;
DROP POLICY IF EXISTS "Anyone can read online games" ON public.online_games;
DROP POLICY IF EXISTS "Anyone can update online games" ON public.online_games;
REVOKE ALL ON public.online_games FROM anon, authenticated;
GRANT ALL ON public.online_games TO service_role;
ALTER TABLE public.online_games ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS online_games_code_key ON public.online_games(code);