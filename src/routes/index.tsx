import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Sparkles, MapPin, Navigation, Heart } from "lucide-react";
import { useWishlist } from "@/lib/wishlist";
import { GoogleStoreMap } from "@/components/app/GoogleStoreMap";
import { ProductCard } from "@/components/app/ProductCard";
import { StoreCard } from "@/components/app/StoreCard";
import { useGeolocation } from "@/lib/geo";
import {
  directionsUrl,
  distanceKm,
  FEATURED_SETS,
  useCatalog,
  type Store,
} from "@/lib/mtg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MTG SG Finder — Magic Cards at Singapore Game Stores" },
      {
        name: "description",
        content:
          "Find Magic: The Gathering singles, boosters, Commander decks and accessories in stock at Dueller's Point, Manchi Games and Games Haven AMK.",
      },
      { property: "og:title", content: "MTG SG Finder" },
      {
        property: "og:description",
        content: "Live Magic inventory and directions for Singapore's local game stores.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const { coords, status } = useGeolocation();
  const { stores, products, inventory, isLoading } = useCatalog();
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const { items: wished } = useWishlist();

  const nearby = useMemo(
    () =>
      stores
        .map((s) => ({ store: s, distance: distanceKm(coords, s) }))
        .sort((a, b) => a.distance - b.distance),
    [stores, coords],
  );

  const trending = useMemo(
    () => products.filter((p) => p.category === "single").slice(0, 4),
    [products],
  );
  const sealed = useMemo(
    () => products.filter((p) => p.category !== "single" && p.category !== "accessory").slice(0, 4),
    [products],
  );

  const active: Store | undefined = stores.find((s) => s.id === activeId);

  return (
    <div className="pb-6">
      <header className="relative overflow-hidden px-4 pb-5 pt-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-primary/15 blur-3xl" />
        <Link
          to="/wishlist"
          aria-label="Wishlist"
          className="absolute right-4 top-7 grid h-10 w-10 place-items-center rounded-full border border-border bg-card"
        >
          <Heart className="h-4.5 w-4.5 text-primary" />
          {wished.length > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-foreground">
              {wished.length}
            </span>
          )}
        </Link>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Singapore</p>
        <h1 className="mt-1 font-display text-3xl font-bold leading-tight">
          <span className="text-gradient-gold">MTG SG Finder</span>
        </h1>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Live stock, prices and directions for Singapore's Magic game stores.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void navigate({ to: "/search", search: { q: query } });
          }}
          className="mt-5"
        >
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cards, boosters, decks…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-linear-to-r from-primary to-warning px-3 py-1.5 text-xs font-bold text-primary-foreground"
            >
              Find
            </button>
          </div>
        </form>
      </header>

      <section className="space-y-3 px-4">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-lg font-semibold">Store map</h2>
          <Link to="/map" className="text-xs font-semibold text-primary">
            Full map
          </Link>
        </div>
        <GoogleStoreMap
          stores={stores}
          activeId={activeId}
          user={status === "granted" ? coords : undefined}
          onSelect={(s) => setActiveId(s.id)}
          className="h-64"
        />
        {active && (
          <div className="rounded-xl border border-primary/50 bg-card p-3">
            <p className="text-sm font-semibold">{active.name}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3" /> {active.address} · {distanceKm(coords, active)} km
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                to="/store/$storeId"
                params={{ storeId: active.id }}
                className="rounded-lg border border-border py-2 text-center text-xs font-semibold"
              >
                Store profile
              </Link>
              <a
                href={directionsUrl(active)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-lg bg-linear-to-r from-primary to-warning py-2 text-xs font-bold text-primary-foreground"
              >
                <Navigation className="h-3.5 w-3.5" /> Directions
              </a>
            </div>
          </div>
        )}
      </section>

      <section className="mt-7 space-y-3">
        <h2 className="px-4 font-display text-lg font-semibold">Featured sets</h2>
        <div className="flex snap-x gap-3 overflow-x-auto px-4 pb-1">
          {FEATURED_SETS.map((set) => (
            <Link
              key={set.code}
              to="/search"
              search={{ q: set.name }}
              className="w-32 shrink-0 snap-start rounded-xl border border-border bg-card p-3"
              style={{ background: `linear-gradient(160deg, oklch(0.3 0.09 ${set.hue} / 0.55), transparent)` }}
            >
              <span className="font-display text-xl font-bold text-primary">{set.code}</span>
              <p className="mt-1 truncate text-xs font-medium">{set.name}</p>
              <p className="text-[10px] text-muted-foreground">{set.released}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-7 space-y-3 px-4">
        <div className="flex items-end justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Sparkles className="h-4 w-4 text-primary" /> Trending singles
          </h2>
          <Link to="/search" search={{ q: "" }} className="text-xs font-semibold text-primary">
            See all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {trending.map((p) => (
            <ProductCard key={p.id} product={p} inventory={inventory} stores={stores} />
          ))}
        </div>
        {isLoading && <p className="text-center text-xs text-muted-foreground">Loading catalog…</p>}
      </section>

      <section className="mt-7 space-y-3 px-4">
        <h2 className="font-display text-lg font-semibold">Sealed &amp; decks</h2>
        <div className="grid grid-cols-2 gap-3">
          {sealed.map((p) => (
            <ProductCard key={p.id} product={p} inventory={inventory} stores={stores} />
          ))}
        </div>
      </section>

      <section className="mt-7 space-y-3 px-4">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-lg font-semibold">Nearby stores</h2>
          <span className="text-[11px] text-muted-foreground">
            {status === "granted" ? "Live location" : "Central Singapore"}
          </span>
        </div>
        <div className="space-y-2">
          {nearby.map(({ store, distance }) => (
            <StoreCard key={store.id} store={store} distance={distance} />
          ))}
        </div>
        {!isLoading && stores.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            No stores loaded yet.
          </p>
        )}
      </section>

      <p className="mt-8 px-4 text-center text-[10px] text-muted-foreground">
        Prices shown in SGD. Stock updates live from participating stores.
      </p>
    </div>
  );
}
