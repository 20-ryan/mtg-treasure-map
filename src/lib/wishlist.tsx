import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type WishlistEntry = { id: string; notify: boolean };

type WishlistApi = {
  items: WishlistEntry[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  setNotify: (id: string, notify: boolean) => void;
};

const KEY = "mtg-store-finder-wishlist";
const WishlistContext = createContext<WishlistApi | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistEntry[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw) as WishlistEntry[]);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const has = useCallback((id: string) => items.some((i) => i.id === id), [items]);

  const toggle = useCallback((id: string) => {
    setItems((prev) =>
      prev.some((i) => i.id === id) ? prev.filter((i) => i.id !== id) : [...prev, { id, notify: true }],
    );
  }, []);

  const remove = useCallback((id: string) => setItems((p) => p.filter((i) => i.id !== id)), []);

  const setNotify = useCallback((id: string, notify: boolean) => {
    setItems((p) => p.map((i) => (i.id === id ? { ...i, notify } : i)));
  }, []);

  const value = useMemo(
    () => ({ items, has, toggle, remove, setNotify }),
    [items, has, toggle, remove, setNotify],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
