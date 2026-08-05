CREATE TABLE public.stores (
  id text PRIMARY KEY,
  name text NOT NULL,
  blurb text NOT NULL DEFAULT '',
  address text NOT NULL,
  postal_code text NOT NULL,
  area text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  hours text NOT NULL,
  phone text,
  website text,
  facebook text,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stores TO anon, authenticated;
GRANT ALL ON public.stores TO service_role;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stores are public" ON public.stores FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.products (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  set_name text NOT NULL,
  set_code text NOT NULL,
  rarity text NOT NULL DEFAULT 'special',
  colors text[] NOT NULL DEFAULT '{}',
  type_line text NOT NULL DEFAULT '',
  oracle text NOT NULL DEFAULT '',
  image_key text NOT NULL DEFAULT '',
  image_url text,
  msrp numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are public" ON public.products FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.store_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id text NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price numeric(10,2) NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  condition text NOT NULL DEFAULT 'Near Mint',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, product_id)
);
GRANT SELECT ON public.store_inventory TO anon, authenticated;
GRANT ALL ON public.store_inventory TO service_role;
ALTER TABLE public.store_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inventory is public" ON public.store_inventory FOR SELECT TO anon, authenticated USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_inventory;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text,
  avatar_url text,
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  notify boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlist_items TO authenticated;
GRANT ALL ON public.wishlist_items TO service_role;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own wishlist" ON public.wishlist_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.stores (id, name, blurb, address, postal_code, area, lat, lng, hours, phone, website, facebook, tags) VALUES
('duellers-point', 'Dueller''s Point', 'WPN Premium card store tucked into a Hougang bomb shelter — deep MTG singles and nightly duels.', '450 Hougang Ave 10, #B1-541', '530450', 'Hougang', 1.3792984, 103.8955344, 'Daily 2:00 PM – 11:00 PM', '+65 8931 2330', 'https://www.duellerspoint.com', 'https://www.facebook.com/DuellersPoint', ARRAY['WPN Premium','Singles','Sealed','Warhammer']),
('manchi-games', 'Manchi Games', 'Neighbourhood Bishan TCG shop with friendly Commander pods and steady sealed restocks.', '254 Bishan Street 22, #B1-444', '570254', 'Bishan', 1.362059, 103.8427318, 'Daily 1:00 PM – 10:00 PM', '+65 8123 4567', NULL, NULL, ARRAY['Commander','Sealed','Casual']),
('games-haven-amk', 'Games Haven – Ang Mo Kio', 'Ang Mo Kio branch of Games Haven with a huge singles inventory and weekly Armory events.', '51 Ang Mo Kio Ave 3, #03-01', '569922', 'Ang Mo Kio', 1.3693454, 103.8471755, 'Weekdays 2:00 PM – 10:00 PM · Weekends 12:00 PM – 10:00 PM', '+65 8022 7993', 'https://www.gameshaventcg.com', 'https://www.facebook.com/gameshavensg', ARRAY['Singles','Tournaments','Accessories']);

INSERT INTO public.products (id, name, category, set_name, set_code, rarity, colors, type_line, oracle, image_key, image_url, msrp) VALUES
('sol-ring','Sol Ring','single','Commander Masters','CMM','uncommon',ARRAY['C'],'Artifact','{T}: Add {C}{C}.','','https://api.scryfall.com/cards/named?exact=Sol%20Ring&format=image&version=normal',4.50),
('lightning-bolt','Lightning Bolt','single','Modern Horizons 3','MH3','common',ARRAY['R'],'Instant','Lightning Bolt deals 3 damage to any target.','','https://api.scryfall.com/cards/named?exact=Lightning%20Bolt&format=image&version=normal',3.20),
('counterspell','Counterspell','single','Modern Horizons 2','MH2','common',ARRAY['U'],'Instant','Counter target spell.','','https://api.scryfall.com/cards/named?exact=Counterspell&format=image&version=normal',2.40),
('atraxa','Atraxa, Praetors'' Voice','single','Double Masters','2XM','mythic',ARRAY['W','U','B','G'],'Legendary Creature — Phyrexian Angel Horror','Flying, vigilance, deathtouch, lifelink. At the beginning of your end step, proliferate.','','https://api.scryfall.com/cards/named?exact=Atraxa%2C%20Praetors%27%20Voice&format=image&version=normal',32.00),
('ragavan','Ragavan, Nimble Pilferer','single','Modern Horizons 2','MH2','mythic',ARRAY['R'],'Legendary Creature — Monkey Pirate','Whenever Ragavan deals combat damage to a player, create a Treasure token and exile the top card of that player''s library.','','https://api.scryfall.com/cards/named?exact=Ragavan%2C%20Nimble%20Pilferer&format=image&version=normal',62.00),
('sheoldred','Sheoldred, the Apocalypse','single','Dominaria United','DMU','mythic',ARRAY['B'],'Legendary Creature — Phyrexian Praetor','Deathtouch. Whenever you draw a card, you gain 2 life. Whenever an opponent draws a card, they lose 2 life.','','https://api.scryfall.com/cards/named?exact=Sheoldred%2C%20the%20Apocalypse&format=image&version=normal',78.00),
('orcish-bowmasters','Orcish Bowmasters','single','The Lord of the Rings: Tales of Middle-earth','LTR','rare',ARRAY['B'],'Creature — Orc Archer','Flash. When Orcish Bowmasters enters and whenever an opponent draws a card except the first one they draw in each of their draw steps, Orcish Bowmasters deals 1 damage to any target.','','https://api.scryfall.com/cards/named?exact=Orcish%20Bowmasters&format=image&version=normal',44.00),
('the-one-ring','The One Ring','single','The Lord of the Rings: Tales of Middle-earth','LTR','mythic',ARRAY['C'],'Legendary Artifact','Indestructible. When The One Ring enters, if you cast it, you gain protection from everything until your next turn.','','https://api.scryfall.com/cards/named?exact=The%20One%20Ring&format=image&version=normal',58.00),
('edh-eldrazi','Eldrazi Unbound Commander Deck','commander','Modern Horizons 3','MH3','special',ARRAY['C'],'Sealed — 100 Card Commander Deck','Colorless ramp precon led by Ulalek, Fused Atrocity.','edh-eldrazi',NULL,62.00),
('edh-squirreled','Squirreled Away Commander Deck','commander','Bloomburrow','BLB','special',ARRAY['B','G'],'Sealed — 100 Card Commander Deck','Golgari token swarm precon with two foil commanders.','edh-squirreled',NULL,58.00),
('edh-peace-offering','Peace Offering Commander Deck','commander','Bloomburrow','BLB','special',ARRAY['W','U'],'Sealed — 100 Card Commander Deck','Azorius bird flyers precon led by Zinnia, Valley''s Voice.','edh-eldrazi',NULL,58.00),
('blb-play-booster','Bloomburrow Play Booster','play_booster','Bloomburrow','BLB','special',ARRAY[]::text[],'Sealed — Single Play Booster','14 cards from the woodland plane of Bloomburrow.','blb-booster',NULL,7.50),
('mh3-play-booster','Modern Horizons 3 Play Booster','play_booster','Modern Horizons 3','MH3','special',ARRAY[]::text[],'Sealed — Single Play Booster','14 cards of straight-to-Modern power.','blb-booster',NULL,12.00),
('mh3-collector','Modern Horizons 3 Collector Booster','collector_booster','Modern Horizons 3','MH3','special',ARRAY[]::text[],'Sealed — Collector Booster','Foils, borderless treatments and serialized chase cards.','mh3-collector',NULL,48.00),
('blb-collector','Bloomburrow Collector Booster','collector_booster','Bloomburrow','BLB','special',ARRAY[]::text[],'Sealed — Collector Booster','Extended-art and foil-etched Bloomburrow treatments.','mh3-collector',NULL,38.00),
('blb-play-box','Bloomburrow Play Booster Box','booster_box','Bloomburrow','BLB','special',ARRAY[]::text[],'Sealed — 36 Play Boosters','A full display of 36 Bloomburrow Play Boosters.','booster-box',NULL,185.00),
('mh3-play-box','Modern Horizons 3 Play Booster Box','booster_box','Modern Horizons 3','MH3','special',ARRAY[]::text[],'Sealed — 36 Play Boosters','A full display of 36 Modern Horizons 3 Play Boosters.','booster-box',NULL,320.00),
('foundations-starter','Foundations Starter Kit','starter_kit','Foundations','FDN','special',ARRAY[]::text[],'Sealed — 2 Ready-to-Play Decks','Two 60-card decks plus code cards — the easiest way to learn Magic.','starter-kit',NULL,25.00),
('blb-starter','Bloomburrow Starter Kit','starter_kit','Bloomburrow','BLB','special',ARRAY[]::text[],'Sealed — 2 Ready-to-Play Decks','Two ready-to-duel Bloomburrow decks for new players.','starter-kit',NULL,24.00),
('dragon-shield','Dragon Shield Matte Sleeves (100)','accessory','Accessories','ACC','special',ARRAY[]::text[],'Accessory — Sleeves','Standard size matte sleeves, 100 count. Tournament legal.','sleeves',NULL,16.90),
('playmat-arcane','Arcane Sigil Playmat','accessory','Accessories','ACC','special',ARRAY[]::text[],'Accessory — Playmat','Stitched-edge rubber playmat, 24 x 14 inches.','playmat',NULL,39.00),
('deck-box-sigil','Sigil Leather Deck Box','accessory','Accessories','ACC','special',ARRAY[]::text[],'Accessory — Deck Box','Magnetic leather deck box holding 100 double-sleeved cards.','deck-box',NULL,29.00);

INSERT INTO public.store_inventory (store_id, product_id, price, stock, condition, updated_at) VALUES
('duellers-point','sol-ring',4.20,12,'Near Mint', now() - interval '14 minutes'),
('manchi-games','sol-ring',4.90,5,'Lightly Played', now() - interval '2 hours'),
('games-haven-amk','sol-ring',3.90,20,'Near Mint', now() - interval '35 minutes'),
('duellers-point','lightning-bolt',3.00,8,'Near Mint', now() - interval '1 hour'),
('games-haven-amk','lightning-bolt',2.80,15,'Near Mint', now() - interval '20 minutes'),
('manchi-games','lightning-bolt',3.50,0,'Near Mint', now() - interval '3 hours'),
('duellers-point','counterspell',2.20,6,'Near Mint', now() - interval '50 minutes'),
('manchi-games','counterspell',2.60,3,'Near Mint', now() - interval '4 hours'),
('games-haven-amk','counterspell',2.10,11,'Lightly Played', now() - interval '25 minutes'),
('duellers-point','atraxa',31.00,2,'Near Mint', now() - interval '3 hours'),
('games-haven-amk','atraxa',29.50,1,'Lightly Played', now() - interval '1 hour'),
('duellers-point','ragavan',59.00,1,'Near Mint', now() - interval '6 hours'),
('games-haven-amk','ragavan',63.00,2,'Near Mint', now() - interval '40 minutes'),
('manchi-games','ragavan',65.00,0,'Near Mint', now() - interval '1 day'),
('duellers-point','sheoldred',74.00,3,'Near Mint', now() - interval '2 hours'),
('games-haven-amk','sheoldred',79.00,1,'Near Mint', now() - interval '15 minutes'),
('duellers-point','orcish-bowmasters',42.00,4,'Near Mint', now() - interval '90 minutes'),
('manchi-games','orcish-bowmasters',45.00,2,'Near Mint', now() - interval '5 hours'),
('games-haven-amk','orcish-bowmasters',41.50,6,'Near Mint', now() - interval '30 minutes'),
('duellers-point','the-one-ring',56.00,1,'Near Mint', now() - interval '8 hours'),
('games-haven-amk','the-one-ring',59.00,2,'Near Mint', now() - interval '55 minutes'),
('duellers-point','edh-eldrazi',60.00,4,'Sealed', now() - interval '1 hour'),
('manchi-games','edh-eldrazi',62.00,2,'Sealed', now() - interval '6 hours'),
('games-haven-amk','edh-eldrazi',58.00,7,'Sealed', now() - interval '45 minutes'),
('duellers-point','edh-squirreled',56.00,3,'Sealed', now() - interval '2 hours'),
('manchi-games','edh-squirreled',57.00,5,'Sealed', now() - interval '3 hours'),
('games-haven-amk','edh-squirreled',55.00,0,'Sealed', now() - interval '20 minutes'),
('manchi-games','edh-peace-offering',56.00,4,'Sealed', now() - interval '90 minutes'),
('games-haven-amk','edh-peace-offering',57.50,3,'Sealed', now() - interval '2 hours'),
('duellers-point','blb-play-booster',7.00,40,'Sealed', now() - interval '30 minutes'),
('manchi-games','blb-play-booster',7.50,22,'Sealed', now() - interval '4 hours'),
('games-haven-amk','blb-play-booster',6.90,60,'Sealed', now() - interval '10 minutes'),
('duellers-point','mh3-play-booster',11.50,25,'Sealed', now() - interval '1 hour'),
('games-haven-amk','mh3-play-booster',11.00,33,'Sealed', now() - interval '18 minutes'),
('duellers-point','mh3-collector',46.00,6,'Sealed', now() - interval '2 hours'),
('manchi-games','mh3-collector',49.00,2,'Sealed', now() - interval '7 hours'),
('games-haven-amk','mh3-collector',45.00,9,'Sealed', now() - interval '25 minutes'),
('duellers-point','blb-collector',37.00,5,'Sealed', now() - interval '3 hours'),
('games-haven-amk','blb-collector',36.00,8,'Sealed', now() - interval '1 hour'),
('duellers-point','blb-play-box',179.00,3,'Sealed', now() - interval '5 hours'),
('manchi-games','blb-play-box',185.00,1,'Sealed', now() - interval '1 day'),
('games-haven-amk','blb-play-box',175.00,4,'Sealed', now() - interval '35 minutes'),
('duellers-point','mh3-play-box',315.00,2,'Sealed', now() - interval '4 hours'),
('games-haven-amk','mh3-play-box',309.00,1,'Sealed', now() - interval '50 minutes'),
('manchi-games','mh3-play-box',325.00,0,'Sealed', now() - interval '2 days'),
('duellers-point','foundations-starter',24.00,10,'Sealed', now() - interval '1 hour'),
('manchi-games','foundations-starter',25.00,6,'Sealed', now() - interval '3 hours'),
('games-haven-amk','foundations-starter',23.50,14,'Sealed', now() - interval '40 minutes'),
('manchi-games','blb-starter',23.00,4,'Sealed', now() - interval '5 hours'),
('games-haven-amk','blb-starter',22.50,9,'Sealed', now() - interval '2 hours'),
('duellers-point','dragon-shield',16.00,30,'Sealed', now() - interval '20 minutes'),
('manchi-games','dragon-shield',16.90,12,'Sealed', now() - interval '6 hours'),
('games-haven-amk','dragon-shield',15.50,45,'Sealed', now() - interval '15 minutes'),
('duellers-point','playmat-arcane',38.00,5,'Sealed', now() - interval '3 hours'),
('games-haven-amk','playmat-arcane',36.00,7,'Sealed', now() - interval '1 hour'),
('manchi-games','deck-box-sigil',28.00,8,'Sealed', now() - interval '2 hours'),
('games-haven-amk','deck-box-sigil',27.00,10,'Sealed', now() - interval '30 minutes');