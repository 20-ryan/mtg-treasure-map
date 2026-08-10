import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type CollectionCard = {
  id: string;
  card_name: string;
  set_code: string;
  set_name: string;
  rarity: string;
  collector_number: string | null;
  image_url: string | null;
  quantity: number;
  created_at: string;
};

export type ScannedCard = {
  card_name: string;
  set_code: string;
  set_name: string;
  rarity: string;
  collector_number: string | null;
  image_url: string | null;
};

export const RARITY_ORDER = ["mythic", "rare", "uncommon", "common", "special"] as const;

export function xpForLevel(level: number) {
  return level * 250;
}

export function levelFromXp(xp: number) {
  let level = 1;
  let remaining = xp;
  while (remaining >= xpForLevel(level)) {
    remaining -= xpForLevel(level);
    level += 1;
  }
  return { level, into: remaining, need: xpForLevel(level) };
}

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, xp, level, coins")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCollection() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["collection", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_collections")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CollectionCard[];
    },
  });
}

export function useCollectionActions() {
  const { user } = useAuth();
  const qc = useQueryClient();

  async function awardXp(amount: number) {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("xp").eq("id", user.id).maybeSingle();
    const next = (data?.xp ?? 0) + amount;
    await supabase
      .from("profiles")
      .update({ xp: next, level: levelFromXp(next).level })
      .eq("id", user.id);
    await qc.invalidateQueries({ queryKey: ["profile", user.id] });
  }

  async function addCard(card: ScannedCard) {
    if (!user) throw new Error("Sign in to build your collection.");
    const { data: existing } = await supabase
      .from("user_collections")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("card_name", card.card_name)
      .eq("set_code", card.set_code)
      .maybeSingle();

    let duplicate = false;
    if (existing) {
      duplicate = true;
      const { error } = await supabase
        .from("user_collections")
        .update({ quantity: existing.quantity + 1 })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("user_collections").insert({ user_id: user.id, ...card });
      if (error) throw error;
    }
    await qc.invalidateQueries({ queryKey: ["collection", user.id] });
    await awardXp(duplicate ? 15 : 50);
    return { duplicate, xp: duplicate ? 15 : 50 };
  }

  async function removeCard(id: string) {
    const { error } = await supabase.from("user_collections").delete().eq("id", id);
    if (error) throw error;
    await qc.invalidateQueries({ queryKey: ["collection", user?.id] });
  }

  return { addCard, removeCard, awardXp, signedIn: !!user };
}

export function collectionStats(cards: CollectionCard[]) {
  const total = cards.reduce((n, c) => n + c.quantity, 0);
  const unique = cards.length;
  const duplicates = total - unique;
  const bySet = new Map<string, number>();
  const byRarity = new Map<string, number>();
  for (const c of cards) {
    const setKey = c.set_name || c.set_code || "Unknown set";
    bySet.set(setKey, (bySet.get(setKey) ?? 0) + c.quantity);
    byRarity.set(c.rarity.toLowerCase(), (byRarity.get(c.rarity.toLowerCase()) ?? 0) + c.quantity);
  }
  return {
    total,
    unique,
    duplicates,
    bySet: [...bySet.entries()].sort((a, b) => b[1] - a[1]),
    byRarity: [...byRarity.entries()].sort((a, b) => b[1] - a[1]),
    completion: Math.min(100, Math.round((unique / 1000) * 100)),
  };
}

export const ACHIEVEMENTS = [
  { id: "first", label: "First Card", hint: "Scan your first card", at: 1 },
  { id: "collector", label: "Collector", hint: "100 cards owned", at: 100 },
  { id: "master", label: "Master Collector", hint: "1,000 cards owned", at: 1000 },
] as const;
