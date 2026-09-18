CREATE TABLE public.online_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  fen TEXT NOT NULL DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  pgn TEXT NOT NULL DEFAULT '',
  last_from TEXT,
  last_to TEXT,
  white_token TEXT,
  black_token TEXT,
  status TEXT NOT NULL DEFAULT 'waiting',
  base_seconds INTEGER NOT NULL DEFAULT 300,
  white_clock INTEGER NOT NULL DEFAULT 300,
  black_clock INTEGER NOT NULL DEFAULT 300,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.online_games TO anon;
GRANT SELECT, INSERT, UPDATE ON public.online_games TO authenticated;
GRANT ALL ON public.online_games TO service_role;

ALTER TABLE public.online_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read online games" ON public.online_games FOR SELECT USING (true);
CREATE POLICY "Anyone can create online games" ON public.online_games FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update online games" ON public.online_games FOR UPDATE USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.touch_online_games()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER touch_online_games_updated_at
BEFORE UPDATE ON public.online_games
FOR EACH ROW EXECUTE FUNCTION public.touch_online_games();

ALTER TABLE public.online_games REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.online_games;