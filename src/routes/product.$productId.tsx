import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Navigation, Bell } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { useGeolocation } from "@/lib/geo";
import {
  CATEGORY_LABELS,
  directionsUrl,
  distanceKm,
  listingsFor,
  minutesAgo,
  productImage,
  useCatalog,
} from "@/lib/mtg";
import { useWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$productId")({
  head: () => ({
    meta: [
      { title: "Product — MTG SG Finder" },
      { name: "description", content: "Compare Magic product prices and stock across Singapore game stores." },
      { property: "og:title", content: "Product — MTG SG Finder" },
      { property: "og:description", content: "Live prices, stock and directions at Singapore MTG stores." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { productId } = Route.useParams();
  const { coords } = useGeolocation();
  const { stores, products, inventory, isLoading } = useCatalog();
  const { has, toggle } = useWishlist();

  const product = products.find((p) => p.id === productId);
  if (isLoading) return <p className="p-10 text-center text-xs text-muted-foreground">Loading…</p>;
  if (!product) return <p className="p-10 text-center text-sm">Product not found.</p>;

  const listings = listingsFor(inventory, product.id);
  const saved = has(product.id);

  return (
    <div className="pb-10">
      <PageHeader title={product.name} subtitle={`${product.set_name} · ${CATEGORY_LABELS[product.category]}`} back />

      <div className="space-y-6 px-4 pt-4">
        <div className="flex gap-4">
          <img
            src={productImage(product)}
            alt={product.name}
            className="h-44 w-32 shrink-0 rounded-xl border border-border object-cover"
          />
          <div className="min-w-0 space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-primary">{product.rarity}</p>
            <p className="text-sm font-medium">{product.type_line}</p>
            <p className="text-xs text-muted-foreground">{product.oracle}</p>
            <p className="text-sm font-bold text-gradient-gold">MSRP S${product.msrp.toFixed(2)}</p>
            <button
              type="button"
              onClick={() => void toggle(product.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold",
                saved ? "border-accent text-accent" : "border-border text-muted-foreground",
              )}
            >
              <Heart className={cn("h-3.5 w-3.5", saved && "fill-accent")} />
              {saved ? "On wishlist" : "Add to wishlist"}
            </button>
          </div>
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">Price comparison</h2>
          {listings.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              None of the three stores list this product yet.
            </p>
          )}
          {listings.map((l) => {
            const store = stores.find((s) => s.id === l.store_id);
            if (!store) return null;
            return (
              <div key={l.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      to="/store/$storeId"
                      params={{ storeId: store.id }}
                      className="truncate text-sm font-semibold hover:text-primary"
                    >
                      {store.name}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">
                      {distanceKm(coords, store)} km · {l.condition} · updated {minutesAgo(l.updated_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gradient-gold">S${l.price.toFixed(2)}</p>
                    <p className={cn("text-[11px]", l.stock > 0 ? "text-success" : "text-muted-foreground")}>
                      {l.stock > 0 ? `${l.stock} in stock` : "Out of stock"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {l.stock > 0 ? (
                    <a
                      href={directionsUrl(store)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-linear-to-r from-primary to-warning py-2 text-xs font-bold text-primary-foreground"
                    >
                      <Navigation className="h-3.5 w-3.5" /> Directions
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void toggle(product.id)}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-semibold text-primary"
                    >
                      <Bell className="h-3.5 w-3.5" /> Notify on restock
                    </button>
                  )}
                  <Link
                    to="/store/$storeId"
                    params={{ storeId: store.id }}
                    className="rounded-lg border border-border py-2 text-center text-xs font-semibold"
                  >
                    Store profile
                  </Link>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
