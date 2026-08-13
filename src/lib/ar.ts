import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGamification } from "@/lib/gamification";

export type ArCollectible = {
  id: string;
  store_id: string;
  name: string;
  description: string;
  rarity: string;
  icon: string;
  xp_reward: number;
};

export type ArDiscovery = {
  collectible_id: string;
  store_id: string | null;
  discovered_at: string;
};

export const AR_XP = {
  scanCard: 5,
  identifyNewCard: 10,
  showcase: 5,
  checkIn: 50,
  allStores: 300,
} as const;

/** AR check-in cooldown, prevents XP farming at the same store. */
export const AR_CHECKIN_COOLDOWN_MS = 4 * 60 * 60 * 1000;

/* ---------------- geometry ---------------- */

const toRad = (v: number) => (v * Math.PI) / 180;

/** Compass bearing in degrees (0 = north) from one coordinate to another. */
export function bearingTo(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(toRad(to.lat));
  const x =
    Math.cos(toRad(from.lat)) * Math.sin(toRad(to.lat)) -
    Math.sin(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.cos(dLng);
  return (((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360;
}

/** Signed difference (-180..180) between a target bearing and the current heading. */
export function relativeBearing(target: number, heading: number) {
  return ((target - heading + 540) % 360) - 180;
}

export function compassLabel(bearing: number) {
  const points = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return points[Math.round(bearing / 45) % 8]!;
}

/** Live device compass heading, when the browser exposes it. */
export function useDeviceHeading() {
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function onOrient(e: DeviceOrientationEvent) {
      const webkit = (e as DeviceOrientationEvent & { webkitCompassHeading?: number })
        .webkitCompassHeading;
      if (typeof webkit === "number") {
        setHeading(webkit);
        return;
      }
      if (typeof e.alpha === "number") setHeading((360 - e.alpha) % 360);
    }
    window.addEventListener("deviceorientationabsolute", onOrient as EventListener);
    window.addEventListener("deviceorientation", onOrient as EventListener);
    return () => {
      window.removeEventListener("deviceorientationabsolute", onOrient as EventListener);
      window.removeEventListener("deviceorientation", onOrient as EventListener);
    };
  }, []);

  async function requestPermission() {
    const anyOrientation = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    if (typeof anyOrientation?.requestPermission === "function") {
      try {
        await anyOrientation.requestPermission();
      } catch {
        /* user declined — markers fall back to a static compass */
      }
    }
  }

  return { heading, requestPermission };
}

/* ---------------- queries ---------------- */

export function useArCollectibles() {
  return useQuery({
    queryKey: ["ar-collectibles"],
    staleTime: 300_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ar_collectibles")
        .select("id, store_id, name, description, rarity, icon, xp_reward")
        .order("xp_reward");
      if (error) throw error;
      return (data ?? []) as ArCollectible[];
    },
  });
}

export function useArDiscoveries() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["ar-discoveries", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_ar_discoveries")
        .select("collectible_id, store_id, discovered_at")
        .order("discovered_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ArDiscovery[];
    },
  });
}

/* ---------------- actions ---------------- */

export function useArActions() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { awardXp, syncAchievements, bumpChallenge } = useGamification();

  async function arStats() {
    const [{ data: discoveries }, { data: checkIns }] = await Promise.all([
      supabase.from("user_ar_discoveries").select("collectible_id"),
      supabase.from("store_check_ins").select("store_id"),
    ]);
    const stores = new Set((checkIns ?? []).map((c) => c.store_id)).size;
    return {
      ar_discoveries: (discoveries ?? []).length,
      ar_checkin_stores: stores,
      ar_stores_visited: stores,
      distinct_stores: stores,
    };
  }

  /** Collect an AR object. Returns null when it was already discovered. */
  async function discover(collectible: ArCollectible) {
    if (!user) throw new Error("Sign in to save AR discoveries.");
    const { error } = await supabase.from("user_ar_discoveries").insert({
      user_id: user.id,
      collectible_id: collectible.id,
      store_id: collectible.store_id,
    });
    if (error) {
      if (error.code === "23505") return null;
      throw error;
    }
    await awardXp(collectible.xp_reward);
    await qc.invalidateQueries({ queryKey: ["ar-discoveries", user.id] });
    const unlocked = await syncAchievements(await arStats());
    return { xp: collectible.xp_reward, unlocked };
  }

  /** AR marker / QR check-in worth +50 XP, rate-limited per store. */
  async function arCheckIn(storeId: string) {
    if (!user) throw new Error("Sign in to check in at a store.");
    const since = new Date(Date.now() - AR_CHECKIN_COOLDOWN_MS).toISOString();
    const { data: recent } = await supabase
      .from("store_check_ins")
      .select("id")
      .eq("user_id", user.id)
      .eq("store_id", storeId)
      .gte("check_in_date", since)
      .maybeSingle();
    if (recent) return { xp: 0, cooldown: true, unlocked: [] };

    const { error } = await supabase
      .from("store_check_ins")
      .insert({ user_id: user.id, store_id: storeId });
    if (error) throw error;

    await awardXp(AR_XP.checkIn);
    await bumpChallenge("check_ins");
    const unlocked = await syncAchievements(await arStats());
    await qc.invalidateQueries({ queryKey: ["check-ins", user.id] });
    return { xp: AR_XP.checkIn, cooldown: false, unlocked };
  }

  return { discover, arCheckIn, awardXp, signedIn: !!user };
}