CREATE TABLE public.ar_collectibles (
  id text PRIMARY KEY,
  store_id text NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  rarity text NOT NULL DEFAULT 'common',
  icon text NOT NULL DEFAULT 'shard',
  xp_reward integer NOT NULL DEFAULT 50,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ar_collectibles TO anon;
GRANT SELECT ON public.ar_collectibles TO authenticated;
GRANT ALL ON public.ar_collectibles TO service_role;

ALTER TABLE public.ar_collectibles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AR collectibles are public" ON public.ar_collectibles FOR SELECT USING (true);

CREATE TABLE public.user_ar_discoveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  collectible_id text NOT NULL REFERENCES public.ar_collectibles(id) ON DELETE CASCADE,
  store_id text REFERENCES public.stores(id) ON DELETE SET NULL,
  discovered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, collectible_id)
);

GRANT SELECT, INSERT, DELETE ON public.user_ar_discoveries TO authenticated;
GRANT ALL ON public.user_ar_discoveries TO service_role;

ALTER TABLE public.user_ar_discoveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own AR discoveries" ON public.user_ar_discoveries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own AR discoveries" ON public.user_ar_discoveries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

INSERT INTO public.ar_collectibles (id, store_id, name, description, rarity, icon, xp_reward) VALUES
  ('dp-shard',   'duellers-point',  'Planeswalker Shard',  'A splinter of raw planar energy hovering near the play tables.', 'common', 'shard',   50),
  ('dp-fragment','duellers-point',  'Mystic Card Fragment','A torn corner of a long-lost card, still humming with mana.',     'rare',   'fragment',100),
  ('dp-crystal', 'duellers-point',  'Golden Mana Crystal', 'A crystallised drop of pure gold mana.',                          'mythic', 'crystal', 150),
  ('mg-shard',   'manchi-games',    'Planeswalker Shard',  'A splinter of raw planar energy drifting by the counter.',        'common', 'shard',   50),
  ('mg-fragment','manchi-games',    'Mystic Card Fragment','A fragment left behind after a fierce Commander pod.',            'rare',   'fragment',100),
  ('mg-crystal', 'manchi-games',    'Golden Mana Crystal', 'A crystallised drop of pure gold mana.',                          'mythic', 'crystal', 150),
  ('gh-shard',   'games-haven-amk', 'Planeswalker Shard',  'A splinter of raw planar energy above the shelves.',              'common', 'shard',   50),
  ('gh-fragment','games-haven-amk', 'Mystic Card Fragment','A fragment of an ancient printing, faintly glowing.',             'rare',   'fragment',100),
  ('gh-crystal', 'games-haven-amk', 'Golden Mana Crystal', 'A crystallised drop of pure gold mana.',                          'mythic', 'crystal', 150);

INSERT INTO public.achievements (id, name, description, category, requirement_type, requirement_value, xp_reward) VALUES
  ('ar-explorer',            'AR Explorer',            'Discover your first AR object.',                      'ar', 'ar_discoveries',      1,  50),
  ('planeswalker-vision',    'Planeswalker Vision',    'Discover 10 AR objects.',                             'ar', 'ar_discoveries',      10, 150),
  ('store-explorer',         'Store Explorer',         'Complete an AR check-in at all 3 participating stores.','ar','ar_checkin_stores',   3,  200),
  ('ar-collector',           'AR Collector',           'Discover every available AR collectible.',            'ar', 'ar_discoveries',      9,  250),
  ('singapore-planeswalker', 'Singapore Planeswalker', 'Visit all 3 participating stores using AR mode.',     'ar', 'ar_stores_visited',   3,  300)
ON CONFLICT (id) DO NOTHING;