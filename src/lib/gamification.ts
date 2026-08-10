import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { levelFromXp, type CollectionCard } from "@/lib/collection";

export const XP_REWARDS = {
  newCard: 50,
  duplicateCard: 15,
  checkIn: 20,
  receipt: 30,
} as const;

export const LEVEL_TITLES = [
  "Planeswalker Novice",
  "Apprentice Mage",
  "Journeymage",
  "Spellslinger",
  "Archmage",
  "Elder Dragon",
  "Planar Legend",
];

export function levelTitle(level: number) {
  return LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, Math.floor((level - 1) / 3))]!;
}

export type Achievement = {
  id: string;
  name: string;
  description: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
};

export type Challenge = {
  id: string;
  title: string;
  description: string;
  cadence: string;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
};

export type UserChallenge = {
  challenge_id: string;
  period_key: string;
  progress: number;
  completed_at: string | null;
};

export function periodKey(cadence: string, at = new Date()) {
  const y = at.getUTCFullYear();
  if (cadence === "weekly") {
    const start = Date.UTC(y, 0, 1);
    const week = Math.floor((at.getTime() - start) / (7 * 86_400_000)) + 1;
    return `${y}-W${String(week).padStart(2, "0")}`;
  }
  return at.toISOString().slice(0, 10);
}

/* ---------------- queries ---------------- */

export function useAchievements() {
  return useQuery({
    queryKey: ["achievements"],
    staleTime: 300_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("requirement_value");
      if (error) throw error;
      return (data ?? []) as unknown as Achievement[];
    },
  });
}

export function useUnlockedAchievements() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-achievements", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_achievements")
        .select("achievement_id, date_unlocked");
      if (error) throw error;
      return (data ?? []) as { achievement_id: string; date_unlocked: string }[];
    },
  });
}

export function useChallenges() {
  return useQuery({
    queryKey: ["challenges"],
    staleTime: 300_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("challenges").select("*");
      if (error) throw error;
      return (data ?? []) as unknown as Challenge[];
    },
  });
}

export function useUserChallenges() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-challenges", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_challenges")
        .select("challenge_id, period_key, progress, completed_at");
      if (error) throw error;
      return (data ?? []) as unknown as UserChallenge[];
    },
  });
}

export function useCheckIns() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["check-ins", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_check_ins")
        .select("store_id, check_in_date")
        .order("check_in_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as { store_id: string; check_in_date: string }[];
    },
  });
}

export function usePurchases() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["purchases", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("id, store_id, store_name, product_description, quantity, price, purchase_date")
        .order("purchase_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as {
        id: string;
        store_id: string | null;
        store_name: string | null;
        product_description: string | null;
        quantity: number | null;
        price: number | null;
        purchase_date: string;
      }[];
    },
  });
}

/* ---------------- actions ---------------- */

export function useGamification() {
  const { user } = useAuth();
  const qc = useQueryClient();

  async function awardXp(amount: number) {
    if (!user || amount <= 0) return;
    const { data } = await supabase.from("profiles").select("xp, coins").eq("id", user.id).maybeSingle();
    const nextXp = (data?.xp ?? 0) + amount;
    await supabase
      .from("profiles")
      .update({
        xp: nextXp,
        level: levelFromXp(nextXp).level,
        coins: (data?.coins ?? 0) + Math.round(amount / 5),
      })
      .eq("id", user.id);
    await qc.invalidateQueries({ queryKey: ["profile", user.id] });
  }

  /** Records progress against every challenge of the given requirement type. */
  async function bumpChallenge(requirementType: string, amount = 1) {
    if (!user) return;
    const { data: challenges } = await supabase
      .from("challenges")
      .select("*")
      .eq("requirement_type", requirementType);
    for (const c of (challenges ?? []) as unknown as Challenge[]) {
      const key = periodKey(c.cadence);
      const { data: existing } = await supabase
        .from("user_challenges")
        .select("id, progress, completed_at")
        .eq("user_id", user.id)
        .eq("challenge_id", c.id)
        .eq("period_key", key)
        .maybeSingle();

      const progress = (existing?.progress ?? 0) + amount;
      const justCompleted = !existing?.completed_at && progress >= c.requirement_value;
      const completed_at = existing?.completed_at ?? (justCompleted ? new Date().toISOString() : null);

      if (existing) {
        await supabase
          .from("user_challenges")
          .update({ progress, completed_at, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase.from("user_challenges").insert({
          user_id: user.id,
          challenge_id: c.id,
          period_key: key,
          progress,
          completed_at,
        });
      }
      if (justCompleted) await awardXp(c.xp_reward);
    }
    await qc.invalidateQueries({ queryKey: ["user-challenges", user.id] });
  }

  /** Unlocks any achievement whose requirement is now met. Returns newly unlocked ones. */
  async function syncAchievements(stats: Record<string, number>) {
    if (!user) return [];
    const [{ data: all }, { data: mine }] = await Promise.all([
      supabase.from("achievements").select("*"),
      supabase.from("user_achievements").select("achievement_id"),
    ]);
    const owned = new Set((mine ?? []).map((a) => a.achievement_id));
    const unlocked: Achievement[] = [];
    for (const a of (all ?? []) as unknown as Achievement[]) {
      if (owned.has(a.id)) continue;
      if ((stats[a.requirement_type] ?? 0) >= a.requirement_value) unlocked.push(a);
    }
    if (unlocked.length) {
      await supabase
        .from("user_achievements")
        .insert(unlocked.map((a) => ({ user_id: user.id, achievement_id: a.id })));
      for (const a of unlocked) await awardXp(a.xp_reward);
      await qc.invalidateQueries({ queryKey: ["user-achievements", user.id] });
    }
    return unlocked;
  }

  /** QR check-in. One XP-earning check-in per store per day. */
  async function checkIn(storeId: string) {
    if (!user) throw new Error("Sign in to check in at a store.");
    const since = new Date(Date.now() - 86_400_000).toISOString();
    const { data: recent } = await supabase
      .from("store_check_ins")
      .select("id")
      .eq("user_id", user.id)
      .eq("store_id", storeId)
      .gte("check_in_date", since)
      .maybeSingle();
    if (recent) return { xp: 0, repeat: true };

    const { error } = await supabase
      .from("store_check_ins")
      .insert({ user_id: user.id, store_id: storeId });
    if (error) throw error;
    await awardXp(XP_REWARDS.checkIn);
    await bumpChallenge("check_ins");

    const { data: rows } = await supabase.from("store_check_ins").select("store_id");
    const distinct = new Set((rows ?? []).map((r) => r.store_id)).size;
    await bumpChallenge("distinct_stores", 0);
    await syncAchievements({ distinct_stores: distinct });
    await qc.invalidateQueries({ queryKey: ["check-ins", user.id] });
    return { xp: XP_REWARDS.checkIn, repeat: false };
  }

  async function logPurchase(entry: {
    store_id?: string | null;
    store_name?: string | null;
    product_description: string;
    quantity: number;
    price?: number | null;
  }) {
    if (!user) throw new Error("Sign in to log purchases.");
    const { error } = await supabase.from("purchases").insert({
      user_id: user.id,
      product_description: entry.product_description,
      quantity: entry.quantity,
      ...(entry.store_id ? { store_id: entry.store_id } : {}),
      ...(entry.store_name ? { store_name: entry.store_name } : {}),
      ...(typeof entry.price === "number" ? { price: entry.price } : {}),
    });
    if (error) throw error;
    await awardXp(XP_REWARDS.receipt);
    await qc.invalidateQueries({ queryKey: ["purchases", user.id] });
  }

  return { awardXp, bumpChallenge, syncAchievements, checkIn, logPurchase, signedIn: !!user };
}

/** Collection-derived stats used to evaluate achievements. */
export function achievementStats(cards: CollectionCard[], purchases: { product_description: string | null }[]) {
  const total = cards.reduce((n, c) => n + c.quantity, 0);
  const text = purchases.map((p) => (p.product_description ?? "").toLowerCase());
  return {
    cards_total: total,
    cards_unique: cards.length,
    commander_purchases: text.filter((t) => t.includes("commander")).length,
    booster_purchases: text.filter((t) => t.includes("booster")).length,
  };
}
