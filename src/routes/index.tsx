import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, MapPin, Navigation, Heart, Camera, QrCode, Layers, Trophy } from "lucide-react";
import { useWishlist } from "@/lib/wishlist";
import { StoreMap } from "@/components/app/StoreMap";
import { ProductCard } from "@/components/app/ProductCard";
import { StoreCard } from "@/components/app/StoreCard";
import { useGeolocation } from "@/lib/geo";
import { directionsUrl, distanceKm, UNAVAILABLE, useCatalog, type Store } from "@/lib/mtg";
import { levelFromXp, useCollection, useProfile } from "@/lib/collection";
import { levelTitle, useChallenges, useUserChallenges, periodKey } from "@/lib/gamification";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MTG SG Finder — Magic Cards at Singapore Game Stores" },
      {
        name: "description",
        content:
          "Find Magic: The Gathering singles, boosters, Commander decks and accessories at Dueller's Point, Manchi Games and Games Haven Ang Mo Kio.",
      },
      { property: "og:title", content: "MTG SG Finder" },
      {
        property: "og:description",
        content: "Store map, live inventory, AI card scanner and collection XP for Singapore Magic players.",
      },
    ],
  }),
  component: HomePage,
});

const QUICK = [
  { to: "/scan", label: "Scan card", icon: Camera },
  { to: "/scan", label: "Check in", icon: QrCode },
  { to: "/collection", label: "Collection", icon: Layers },
  { to: "/account", label: "Badges", icon: Trophy },
] as const;

function HomePage() {
  const navigate = useNavigate();
  const { coords, status } = useGeolocation();
  const { stores, products, inventory, isLoading } = useCatalog();
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const { items: wished } = useWishlist();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: cards = [] } = useCollection();
  const { data: challenges = [] } = useChallenges();
  const { data: userChallenges = [] } = useUserChallenges();

  const progress = levelFromXp(profile?.xp ?? 0);
  const owned = cards.reduce((n, c) => n + c.quantity, 0);

  const nearby = useMemo(
    () =>
      stores
        .map((s) => ({ store: s, distance: distanceKm(coords, s) }))
        .sort((a, b) => a.distance - b.distance),
    [stores, coords],
  );

  const trending = useMemo(() => products.slice(0, 4), [products]);
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

        {user ? (
          <div className="mt-4 rounded-2xl border border-border bg-card/80 p-3.5">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold">
                Level {progress.level} · <span className="text-primary">{levelTitle(progress.level)}</span>
              </p>
              <span className="text-[11px] text-muted-foreground">
                {progress.into}/{progress.need} XP
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-linear-to-r from-accent to-primary transition-all"
                style={{ width: `${Math.min(100, (progress.into / progress.need) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {owned} cards collected · {profile?.coins ?? 0} coins
            </p>
          </div>
        ) : (
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Live stock, directions and a card scanner for Singapore's three Magic stores.
          </p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void navigate({ to: "/search", search: { q: query } });
          }}
          className="mt-4"
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

        <Link
          to="/ar"
          className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-primary/60 bg-linear-to-r from-primary/20 via-accent/15 to-transparent px-3 py-3 mythic-ring"
        >
          <span className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-linear-to-br from-primary to-warning text-primary-foreground">
              <Sparkles className="h-4.5 w-4.5" />
            </span>
            <span>
              <span className="block font-display text-sm font-bold text-gradient-gold">AR Collector Mode</span>
              <span className="block text-[10px] text-muted-foreground">
                Scan cards, find stores and hunt AR collectibles
              </span>
            </span>
          </span>
          <span className="shrink-0 text-xs font-bold text-primary">Enter →</span>
        </Link>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {QUICK.map(({ to, label, icon: Icon }) => (
            <Link
              key={label}
              to={to}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card py-3 text-[10px] font-semibold text-muted-foreground"
            >
              <Icon className="h-4.5 w-4.5 text-primary" />
              {label}
            </Link>
          ))}
        </div>
      </header>

      <section className="space-y-3 px-4">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-lg font-semibold">Store map</h2>
          <Link to="/map" className="text-xs font-semibold text-primary">
            Full map
          </Link>
        </div>
        <StoreMap
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

      {user && challenges.length > 0 && (
        <section className="mt-7 space-y-3 px-4">
          <h2 className="font-display text-lg font-semibold">Active challenges</h2>
          <div className="space-y-2">
            {challenges.map((c) => {
              const uc = userChallenges.find(
                (u) => u.challenge_id === c.id && u.period_key === periodKey(c.cadence),
              );
              const pct = Math.min(100, ((uc?.progress ?? 0) / c.requirement_value) * 100);
              return (
                <div key={c.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{c.title}</p>
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-primary">
                      {c.cadence} · +{c.xp_reward} XP
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{c.description}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-right text-[10px] text-muted-foreground">
                    {uc?.progress ?? 0}/{c.requirement_value}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

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
      </section>

      <section className="mt-7 space-y-3 px-4">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-lg font-semibold">Products</h2>
          <Link to="/search" search={{ q: "" }} className="text-xs font-semibold text-primary">
            See all
          </Link>
        </div>
        {trending.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {trending.map((p) => (
              <ProductCard key={p.id} product={p} inventory={inventory} stores={stores} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            {isLoading ? "Loading catalog…" : UNAVAILABLE}
          </p>
        )}
      </section>

      <p className="mt-8 px-4 text-center text-[10px] text-muted-foreground">
        Prices in SGD. Store details show "{UNAVAILABLE}" until confirmed by the store.
      </p>
    </div>
  );
}
