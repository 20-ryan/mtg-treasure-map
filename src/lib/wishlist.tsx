import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type WishlistEntry = { id: string; notify: boolean };

type WishlistApi = {
  items: WishlistEntry[];
  signedIn: boolean;
  has: (id: string) => boolean;
  toggle: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setNotify: (id: string, notify: boolean) => Promise<void>;
};

const KEY = "mtg-sg-finder-wishlist";
const WishlistContext = createContext<WishlistApi | null>(null);

function readLocal(): WishlistEntry[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as WishlistEntry[]) : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistEntry[]>([]);

  /* Guests keep a local wishlist; signed-in players sync with their account. */
  useEffect(() => {
    if (!user) {
      setItems(readLocal());
      return;
    }
    let cancelled = false;
    void (async () => {
      const local = readLocal();
      if (local.length) {
        await supabase
          .from("wishlist_items")
          .upsert(
            local.map((i) => ({ user_id: user.id, product_id: i.id, notify: i.notify })),
            { onConflict: "user_id,product_id" },
          );
        window.localStorage.removeItem(KEY);
      }
      const { data } = await supabase.from("wishlist_items").select("product_id, notify");
      if (!cancelled) {
        setItems((data ?? []).map((r) => ({ id: r.product_id as string, notify: r.notify as boolean })));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (user) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, user]);

  const has = useCallback((id: string) => items.some((i) => i.id === id), [items]);

  const remove = useCallback(
    async (id: string) => {
      setItems((p) => p.filter((i) => i.id !== id));
      if (user) await supabase.from("wishlist_items").delete().eq("product_id", id).eq("user_id", user.id);
    },
    [user],
  );

  const toggle = useCallback(
    async (id: string) => {
      if (items.some((i) => i.id === id)) {
        await remove(id);
        return;
      }
      setItems((p) => [...p, { id, notify: true }]);
      if (user) {
        await supabase
          .from("wishlist_items")
          .upsert({ user_id: user.id, product_id: id, notify: true }, { onConflict: "user_id,product_id" });
      }
    },
    [items, remove, user],
  );

  const setNotify = useCallback(
    async (id: string, notify: boolean) => {
      setItems((p) => p.map((i) => (i.id === id ? { ...i, notify } : i)));
      if (user) await supabase.from("wishlist_items").update({ notify }).eq("product_id", id).eq("user_id", user.id);
    },
    [user],
  );

  const value = useMemo(
    () => ({ items, signedIn: Boolean(user), has, toggle, remove, setNotify }),
    [items, user, has, toggle, remove, setNotify],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
