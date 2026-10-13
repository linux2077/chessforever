CREATE TABLE public.maintenance_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  live_ok boolean NOT NULL,
  closed_stuck integer NOT NULL DEFAULT 0,
  removed_waiting integer NOT NULL DEFAULT 0,
  invalid_fixed integer NOT NULL DEFAULT 0,
  errors jsonb NOT NULL DEFAULT '[]'::jsonb
);
GRANT ALL ON public.maintenance_reports TO service_role;
ALTER TABLE public.maintenance_reports ENABLE ROW LEVEL SECURITY;