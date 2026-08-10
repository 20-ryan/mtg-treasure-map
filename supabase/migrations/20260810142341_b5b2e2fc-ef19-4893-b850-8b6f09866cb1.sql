
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS google_maps_url text NOT NULL DEFAULT 'Information unavailable';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS rating numeric(2,1);
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS photos text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coins integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS favorite_store_id text REFERENCES public.stores(id) ON DELETE SET NULL;

CREATE TABLE public.achievements (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  xp_reward integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.achievements TO anon;
GRANT SELECT ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Achievements are public" ON public.achievements FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_id text NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  date_unlocked timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own achievements" ON public.user_achievements FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.store_check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  store_id text NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  check_in_date timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_check_ins TO authenticated;
GRANT ALL ON public.store_check_ins TO service_role;
ALTER TABLE public.store_check_ins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own check-ins" ON public.store_check_ins FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  store_id text REFERENCES public.stores(id) ON DELETE SET NULL,
  store_name text NOT NULL DEFAULT 'Information unavailable',
  product_description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  price numeric(10,2) NOT NULL DEFAULT 0,
  receipt_image text,
  purchase_date timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own purchases" ON public.purchases FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.store_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  store_id text NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  caption text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.store_photos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_photos TO authenticated;
GRANT ALL ON public.store_photos TO service_role;
ALTER TABLE public.store_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved photos are public" ON public.store_photos FOR SELECT TO anon, authenticated USING (status = 'approved');
CREATE POLICY "Own photos" ON public.store_photos FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.challenges (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  cadence text NOT NULL CHECK (cadence IN ('daily','weekly')),
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  xp_reward integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.challenges TO anon;
GRANT SELECT ON public.challenges TO authenticated;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Challenges are public" ON public.challenges FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.user_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  challenge_id text NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  period_key text NOT NULL,
  progress integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, challenge_id, period_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_challenges TO authenticated;
GRANT ALL ON public.user_challenges TO service_role;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own challenges" ON public.user_challenges FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_user_challenges_updated_at BEFORE UPDATE ON public.user_challenges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.achievements (id, name, description, category, requirement_type, requirement_value, xp_reward) VALUES
  ('first_card', 'First Card', 'Scan your first Magic card', 'Collection', 'cards_total', 1, 25),
  ('collector', 'Collector', 'Own 100 cards', 'Collection', 'cards_total', 100, 100),
  ('master_collector', 'Master Collector', 'Own 1,000 cards', 'Collection', 'cards_total', 1000, 500),
  ('store_explorer', 'Store Explorer', 'Check in at all 3 Singapore stores', 'Store', 'distinct_stores', 3, 150),
  ('commander_enthusiast', 'Commander Enthusiast', 'Log 5 Commander deck purchases', 'Product', 'commander_purchases', 5, 150),
  ('booster_fanatic', 'Booster Fanatic', 'Log 10 booster purchases', 'Product', 'booster_purchases', 10, 150),
  ('completionist', 'Completionist', 'Own 250 unique cards', 'Collection', 'cards_unique', 250, 250),
  ('set_hunter', 'Set Hunter', 'Complete a full set', 'Collection', 'sets_completed', 1, 500);

INSERT INTO public.challenges (id, title, description, cadence, requirement_type, requirement_value, xp_reward) VALUES
  ('daily_scan_3', 'Daily Scanner', 'Scan 3 cards today', 'daily', 'cards_scanned', 3, 100),
  ('daily_checkin_1', 'Daily Visit', 'Check in at any store today', 'daily', 'check_ins', 1, 100),
  ('weekly_scan_20', 'Weekly Archivist', 'Scan 20 cards this week', 'weekly', 'cards_scanned', 20, 100),
  ('weekly_stores_3', 'Weekly Wanderer', 'Check in at all 3 stores this week', 'weekly', 'distinct_stores', 3, 100);
