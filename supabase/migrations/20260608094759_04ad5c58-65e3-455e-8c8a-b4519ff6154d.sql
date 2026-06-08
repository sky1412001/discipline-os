ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS time_block text NOT NULL DEFAULT 'anytime';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS scheduled_time text;

CREATE TABLE public.challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'custom',
  challenge_type text NOT NULL DEFAULT 'weekly',
  total_days integer NOT NULL DEFAULT 7,
  days_completed integer NOT NULL DEFAULT 0,
  start_date date NOT NULL DEFAULT (now()::date),
  last_check_date date,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenges TO authenticated;
GRANT ALL ON public.challenges TO service_role;

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own challenges" ON public.challenges
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();