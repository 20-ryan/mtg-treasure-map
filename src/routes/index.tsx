import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Sparkles, MapPin, ChevronRight, Flame } from "lucide-react";
import { ProductCard } from "@/components/app/ProductCard";
import { StoreCard } from "@/components/app/StoreCard";
import { useGeolocation } from "@/lib/geo";
import { distanceKm, FEATURED_SETS, HOME_COORDS, PRODUCTS, STORES } from "@/lib/mtg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MTG SG Finder — Find Magic Cards at Local Game Stores" },
      {
        name: "description",
        content:
          "Search Magic: The Gathering singles, boosters, commander decks and accessories at Singapore game stores — live stock, price comparison and directions.",
      },
      { property: "og:title", content: "MTG SG Finder — Cards, Stock & Stores Near You" },
      {
        property: "og:description",
        content: "Live inventory, price comparison and directions to Singapore Magic: The Gathering stores.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { coords, status } = useGeolocation();

  const origin = useMemo(() => {
    const d = distanceKm(coords, HOME_COORDS);
    return d > 200 ? HOME_COORDS : coords;
  }, [coords]);

  const nearby = useMemo(
    () =>
      STORES.map((s) => ({ store: s, distance: distanceKm(origin, s) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 3),
    [origin],
  );

  const trending = PRODUCTS.filter((p) => p.type === "single").slice(0, 4);
  const sealed = PRODUCTS.filter((p) => p.type !== "single").slice(0, 4);

  return (
    <div className="space-y-8 pb-8">
      <section className="relative overflow-hidden px-4 pb-6 pt-8">
        <div className="pointer-events-none absolute -left-16 -top-24 h-56 w-56 rounded-full bg-accent/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-0 h-48 w-48 rounded-full bg-arcane/25 blur-3xl" />
        <div className="relative">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Singapore Game Stores
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight">
            Track down every <span className="text-gradient-gold">card</span> in Singapore
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Live inventory and prices from {STORES.length} stores within reach.
          </p>

          <form
            className="relative mt-5"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/search", search: { q: query } });
            }}
          >
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cards, sets, decks…"
              className="h-12 w-full rounded-full border border-border bg-input/70 pl-10 pr-24 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 h-9 rounded-full bg-linear-to-r from-primary to-warning px-4 text-xs font-bold text-primary-foreground"
            >
              Search
            </button>
          </form>

          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {["Sol Ring", "Ragavan", "Play Booster", "Commander deck", "Sleeves"].map((t) => (
              <Link
                key={t}
                to="/search"
                search={{ q: t }}
                className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {t}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <SectionHead title="Featured sets" hint="Newest print runs in stock" />
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
          {FEATURED_SETS.map((set) => (
            <Link
              key={set.code}
              to="/search"
              search={{ q: set.name }}
              className="relative w-40 shrink-0 overflow-hidden rounded-xl border border-border p-4"
              style={{
                background: `linear-gradient(150deg, oklch(0.45 0.16 ${set.hue} / 0.55), oklch(0.2 0.03 285))`,
              }}
            >
              <p className="font-display text-2xl font-bold text-primary">{set.code}</p>
              <p className="mt-1 truncate text-xs font-medium">{set.name}</p>
              <p className="text-[10px] text-muted-foreground">Released {set.released}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionHead title="Trending singles" hint="Most searched this week" icon={<Flame className="h-4 w-4 text-primary" />} />
        <div className="grid grid-cols-2 gap-3 px-4">
          {trending.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between px-4">
          <div>
            <h2 className="text-lg font-semibold">Nearby stores</h2>
            <p className="text-[11px] text-muted-foreground">
              {status === "granted"
                ? "Sorted by your current location"
                : status === "denied"
                  ? "Location off — showing downtown stores"
                  : "Finding stores around you…"}
            </p>
          </div>
          <Link to="/map" className="flex items-center gap-0.5 text-xs font-semibold text-primary">
            Map <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="space-y-2.5 px-4">
          {nearby.map(({ store, distance }) => (
            <StoreCard key={store.id} store={store} distance={distance} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionHead title="Sealed & accessories" hint="Boxes, precons and playmats" icon={<MapPin className="h-4 w-4 text-primary" />} />
        <div className="grid grid-cols-2 gap-3 px-4">
          {sealed.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHead({ title, hint, icon }: { title: string; hint: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-4">
      {icon}
      <div>
        <h2 className="text-lg font-semibold leading-tight">{title}</h2>
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}
