import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/app/ProductCard";
import { PageHeader } from "@/components/app/PageHeader";
import { useGeolocation } from "@/lib/geo";
import {
  bestListing,
  distanceKm,
  HOME_COORDS,
  listingsFor,
  PRODUCTS,
  PRODUCT_LABELS,
  storeById,
  type ProductType,
} from "@/lib/mtg";
import { cn } from "@/lib/utils";

type SearchParams = { q?: string | undefined };

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search["q"] === "string" ? search["q"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Card Search — MTG Store Finder" },
      {
        name: "description",
        content: "Search the Magic card database and filter by price, distance, product type and availability.",
      },
      { property: "og:title", content: "Card Search — MTG Store Finder" },
      { property: "og:description", content: "Filter Magic singles and sealed product by price, distance and stock." },
    ],
  }),
  component: SearchPage,
});

const TYPES: ProductType[] = ["single", "booster", "commander", "accessory"];

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [query, setQuery] = useState(q ?? "");
  const [types, setTypes] = useState<ProductType[]>([]);
  const [maxPrice, setMaxPrice] = useState(150);
  const [maxDistance, setMaxDistance] = useState(10);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { coords } = useGeolocation();

  const origin = distanceKm(coords, HOME_COORDS) > 200 ? HOME_COORDS : coords;

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      if (term && ![p.name, p.set, p.setCode, p.typeLine, p.oracle].join(" ").toLowerCase().includes(term))
        return false;
      if (types.length && !types.includes(p.type)) return false;

      const listings = listingsFor(p.id).filter((l) => {
        const store = storeById(l.storeId);
        return store ? distanceKm(origin, store) <= maxDistance : false;
      });
      const available = listings.filter((l) => l.stock > 0);
      if (inStockOnly && available.length === 0) return false;
      if (!listings.length) return false;

      const cheapest = (available[0] ?? listings[0])!.price;
      return cheapest <= maxPrice;
    });
  }, [query, types, maxPrice, maxDistance, inStockOnly, origin]);

  const activeFilters =
    types.length + (maxPrice < 150 ? 1 : 0) + (maxDistance < 10 ? 1 : 0) + (inStockOnly ? 1 : 0);

  return (
    <div className="pb-8">
      <PageHeader
        title="Card database"
        subtitle={`${results.length} matching products`}
        action={
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "relative grid h-9 w-9 place-items-center rounded-full border border-border",
              showFilters ? "bg-primary text-primary-foreground" : "text-primary",
            )}
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilters > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
                {activeFilters}
              </span>
            )}
          </button>
        }
      />

      <div className="space-y-4 px-4 pt-4">
        <div className="relative">
          <SearchIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              navigate({ to: "/search", search: { q: e.target.value }, replace: true });
            }}
            placeholder="Card name, set or keyword"
            className="h-11 w-full rounded-full border border-border bg-input/70 pl-10 pr-10 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                navigate({ to: "/search", search: {}, replace: true });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {TYPES.map((t) => {
            const active = types.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTypes((p) => (active ? p.filter((x) => x !== t) : [...p, t]))}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                {PRODUCT_LABELS[t]}
              </button>
            );
          })}
        </div>

        {showFilters && (
          <div className="space-y-4 rounded-xl border border-border bg-card p-4">
            <Slider
              label="Max price"
              value={`$${maxPrice}`}
              min={5}
              max={150}
              step={5}
              current={maxPrice}
              onChange={setMaxPrice}
            />
            <Slider
              label="Max distance"
              value={`${maxDistance} km`}
              min={1}
              max={10}
              step={1}
              current={maxDistance}
              onChange={setMaxDistance}
            />
            <label className="flex items-center justify-between text-sm">
              <span>In stock only</span>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="h-5 w-5 accent-[oklch(0.78_0.14_84)]"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setTypes([]);
                setMaxPrice(150);
                setMaxDistance(10);
                setInStockOnly(false);
              }}
              className="w-full rounded-lg border border-border py-2 text-xs font-semibold text-muted-foreground"
            >
              Reset filters
            </button>
          </div>
        )}

        {results.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <p className="text-sm font-semibold">No cards found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try widening your distance or price filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {results.length > 0 && (
          <p className="text-center text-[11px] text-muted-foreground">
            Cheapest match: $
            {Math.min(...results.map((r) => bestListing(r.id)?.price ?? Infinity)).toFixed(2)}
          </p>
        )}
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  current,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold text-primary">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[oklch(0.78_0.14_84)]"
      />
    </div>
  );
}
