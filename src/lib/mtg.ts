import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import blbBooster from "@/assets/blb-booster.jpg";
import mh3Collector from "@/assets/mh3-collector.jpg";
import edhEldrazi from "@/assets/edh-eldrazi.jpg";
import edhSquirreled from "@/assets/edh-squirreled.jpg";
import sleeves from "@/assets/sleeves.jpg";
import playmat from "@/assets/playmat.jpg";
import boosterBox from "@/assets/booster-box.jpg";
import starterKit from "@/assets/starter-kit.jpg";
import deckBox from "@/assets/deck-box.jpg";

export type ProductCategory =
  | "single"
  | "commander"
  | "play_booster"
  | "collector_booster"
  | "booster_box"
  | "starter_kit"
  | "accessory";

export type Store = {
  id: string;
  name: string;
  blurb: string;
  address: string;
  postal_code: string;
  area: string;
  lat: number;
  lng: number;
  hours: string;
  phone: string | null;
  website: string | null;
  facebook: string | null;
  tags: string[];
};

export type Product = {
  id: string;
  name: string;
  category: ProductCategory;
  set_name: string;
  set_code: string;
  rarity: string;
  colors: string[];
  type_line: string;
  oracle: string;
  image_key: string;
  image_url: string | null;
  msrp: number;
};

export type Inventory = {
  id: string;
  store_id: string;
  product_id: string;
  price: number;
  stock: number;
  condition: string;
  updated_at: string;
};

const IMAGES: Record<string, string> = {
  "blb-booster": blbBooster,
  "mh3-collector": mh3Collector,
  "edh-eldrazi": edhEldrazi,
  "edh-squirreled": edhSquirreled,
  sleeves,
  playmat,
  "booster-box": boosterBox,
  "starter-kit": starterKit,
  "deck-box": deckBox,
};

export function productImage(p: Product) {
  return p.image_url ?? IMAGES[p.image_key] ?? blbBooster;
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  single: "Singles",
  commander: "Commander Decks",
  play_booster: "Play Boosters",
  collector_booster: "Collector Boosters",
  booster_box: "Booster Boxes",
  starter_kit: "Starter Kits",
  accessory: "Accessories",
};

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as ProductCategory[];

export const COLOR_META: Record<string, { label: string; hue: string }> = {
  W: { label: "White", hue: "86" },
  U: { label: "Blue", hue: "255" },
  B: { label: "Black", hue: "300" },
  R: { label: "Red", hue: "27" },
  G: { label: "Green", hue: "150" },
  C: { label: "Colorless", hue: "285" },
};

export const FEATURED_SETS = [
  { code: "BLB", name: "Bloomburrow", released: "2024", hue: "155" },
  { code: "MH3", name: "Modern Horizons 3", released: "2024", hue: "262" },
  { code: "LTR", name: "Tales of Middle-earth", released: "2023", hue: "86" },
  { code: "DMU", name: "Dominaria United", released: "2022", hue: "295" },
  { code: "FDN", name: "Foundations", released: "2024", hue: "25" },
];

/* Singapore map centre (roughly between the three stores). */
export const SG_CENTER = { lat: 1.3703, lng: 103.8618 };
export const HOME_COORDS = SG_CENTER;

export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(s)) * 10) / 10;
}

export function directionsUrl(store: Store) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${store.name}, ${store.address}, Singapore ${store.postal_code}`,
  )}`;
}

export function minutesAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export type Catalog = {
  stores: Store[];
  products: Product[];
  inventory: Inventory[];
};

const EMPTY: Catalog = { stores: [], products: [], inventory: [] };

async function fetchCatalog(): Promise<Catalog> {
  const [stores, products, inventory] = await Promise.all([
    supabase.from("stores").select("*").order("name"),
    supabase.from("products").select("*").order("name"),
    supabase.from("store_inventory").select("*"),
  ]);
  if (stores.error) throw stores.error;
  if (products.error) throw products.error;
  if (inventory.error) throw inventory.error;
  return {
    stores: (stores.data ?? []) as unknown as Store[],
    products: (products.data ?? []) as unknown as Product[],
    inventory: (inventory.data ?? []) as unknown as Inventory[],
  };
}

/** Catalog with live inventory updates. */
export function useCatalog() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["catalog"], queryFn: fetchCatalog, staleTime: 30_000 });

  useEffect(() => {
    const channel = supabase
      .channel("inventory-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "store_inventory" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["catalog"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return { ...(query.data ?? EMPTY), isLoading: query.isLoading, error: query.error };
}

export function listingsFor(inventory: Inventory[], productId: string) {
  return inventory.filter((l) => l.product_id === productId).sort((a, b) => a.price - b.price);
}

export function bestListing(inventory: Inventory[], productId: string) {
  return listingsFor(inventory, productId).find((l) => l.stock > 0) ?? null;
}

export const storeById = (stores: Store[], id: string) => stores.find((s) => s.id === id);
export const productById = (products: Product[], id: string) => products.find((p) => p.id === id);
