CREATE TABLE public.user_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  card_name text NOT NULL,
  set_code text NOT NULL DEFAULT '',
  set_name text NOT NULL DEFAULT '',
  rarity text NOT NULL DEFAULT 'common',
  collector_number text,
  image_url text,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, card_name, set_code, collector_number)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_collections TO authenticated;
GRANT ALL ON public.user_collections TO service_role;

ALTER TABLE public.user_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own collection" ON public.user_collections
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_collections_updated_at
  BEFORE UPDATE ON public.user_collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();