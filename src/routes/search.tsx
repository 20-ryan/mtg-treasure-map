import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { ProductCard } from "@/components/app/ProductCard";
import { useGeolocation } from "@/lib/geo";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  distanceKm,
  listingsFor,
  useCatalog,
  type ProductCategory,
} from "@/lib/mtg";
import { cn } from "@/lib/utils";

type SearchParams = { q?: string };
type SortKey = "relevance" | "price" | "distance";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search["q"] === "string" ? (search["q"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Search Magic Products — MTG SG Finder" },
      {
        name: "description",
        content:
          "Search singles, Play Boosters, Collector Boosters, booster boxes, Commander decks, starter kits and accessories across Singapore stores.",
      },
      { property: "og:title", content: "Search Magic Products — MTG SG Finder" },
      { property: "og:description", content: "Filter by stock, price, distance and product category." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const { coords } = useGeolocation();
  const { stores, products, inventory, isLoading } = useCatalog();

  const [term, setTerm] = useState(q ?? "");
  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("relevance");
  const [showFilters, setShowFilters] = useState(false);

  const distanceOf = useMemo(() => {
    const map = new Map<string, number>();
    stores.forEach((s) => map.set(s.id, distanceKm(coords, s)));
    return map;
  }, [stores, coords]);

  const results = useMemo(() => {
    const needle = term.trim().toLowerCase();
    const rows = products
      .filter((p) => category === "all" || p.category === category)
      .filter(
        (p) =>
          !needle ||
          p.name.toLowerCase().includes(needle) ||
          p.set_name.toLowerCase().includes(needle) ||
          p.set_code.toLowerCase().includes(needle) ||
          p.type_line.toLowerCase().includes(needle),
      )
      .map((p) => {
        const listings = listingsFor(inventory, p.id).filter((l) => l.stock > 0);
        const cheapest = listings[0] ?? null;
        const nearest = listings
          .map((l) => ({ l, d: distanceOf.get(l.store_id) ?? 99 }))
          .sort((a, b) => a.d - b.d)[0];
        return {
          product: p,
          listings,
          cheapest,
          nearestKm: nearest?.d ?? null,
        };
      })
      .filter((r) => !inStockOnly || r.listings.length > 0);

    if (sort === "price") {
      rows.sort((a, b) => (a.cheapest?.price ?? Infinity) - (b.cheapest?.price ?? Infinity));
    } else if (sort === "distance") {
      rows.sort((a, b) => (a.nearestKm ?? Infinity) - (b.nearestKm ?? Infinity));
    }
    return rows;
  }, [products, inventory, term, category, inStockOnly, sort, distanceOf]);

  return (
    <div className="pb-8">
      <PageHeader
        title="Search"
        subtitle={`${results.length} of ${products.length} products`}
        action={
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              "grid h-9 w-9 place-items-center rounded-full border transition-colors",
              showFilters ? "border-primary text-primary" : "border-border text-muted-foreground",
            )}
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        }
      />

      <div className="space-y-4 px-4 pt-4">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
          <SearchIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Card name, set or product…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {term && (
            <button type="button" onClick={() => setTerm("")} aria-label="Clear search">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["all", ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c as ProductCategory | "all")}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                category === c
                  ? "border-primary bg-secondary text-primary"
                  : "border-border text-muted-foreground",
              )}
            >
              {c === "all" ? "All" : CATEGORY_LABELS[c as ProductCategory]}
            </button>
          ))}
        </div>

        {showFilters && (
          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            <label className="flex items-center justify-between text-sm">
              In stock only
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="h-4 w-4 accent-[oklch(0.78_0.14_84)]"
              />
            </label>
            <div>
              <p className="text-sm">Sort by</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(
                  [
                    ["relevance", "Relevance"],
                    ["price", "Lowest price"],
                    ["distance", "Nearest store"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSort(key)}
                    className={cn(
                      "rounded-lg border py-2 text-[11px] font-semibold transition-colors",
                      sort === key ? "border-primary bg-secondary text-primary" : "border-border text-muted-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <p className="py-10 text-center text-xs text-muted-foreground">Loading catalog…</p>
        ) : results.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-xs text-muted-foreground">
            No products match those filters.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {results.map((r) => (
              <div key={r.product.id} className="space-y-1">
                <ProductCard product={r.product} inventory={inventory} stores={stores} />
                <p className="px-1 text-[10px] text-muted-foreground">
                  {r.listings.length > 0
                    ? `${r.listings.reduce((n, l) => n + l.stock, 0)} in stock · nearest ${r.nearestKm} km`
                    : "Not currently stocked"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
