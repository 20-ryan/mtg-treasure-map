import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Heart, Navigation, Bell, Store as StoreIcon } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { useGeolocation } from "@/lib/geo";
import {
  COLOR_META,
  directionsUrl,
  distanceKm,
  HOME_COORDS,
  listingsFor,
  productById,
  storeById,
} from "@/lib/mtg";
import { useWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$productId")({
  loader: ({ params }) => {
    const product = productById(params.productId);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Product not found — MTG Store Finder" }, { name: "robots", content: "noindex" }] };
    }
    const { product } = loaderData;
    return {
      meta: [
        { title: `${product.name} — Prices & Stock | MTG Store Finder` },
        { name: "description", content: `Compare local store prices and stock for ${product.name} from ${product.set}.` },
        { property: "og:title", content: `${product.name} — MTG Store Finder` },
        { property: "og:description", content: `Live local prices and availability for ${product.name}.` },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const { has, toggle } = useWishlist();
  const { coords } = useGeolocation();
  const origin = distanceKm(coords, HOME_COORDS) > 200 ? HOME_COORDS : coords;
  const listings = listingsFor(product.id);
  const saved = has(product.id);
  const cheapest = listings.find((l) => l.stock > 0);

  return (
    <div className="pb-10">
      <PageHeader title={product.name} subtitle={`${product.set} · ${product.setCode}`} back />

      <div className="space-y-6 px-4 pt-4">
        <div className="flex gap-4">
          <img
            src={product.image}
            alt={product.name}
            width={244}
            height={340}
            className="h-44 w-32 shrink-0 rounded-xl border border-border object-cover"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                {product.rarity}
              </span>
              {product.colors.map((c: string) => (
                <span
                  key={c}
                  className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    background: `oklch(0.45 0.13 ${COLOR_META[c]?.hue ?? "285"} / 0.5)`,
                  }}
                >
                  {COLOR_META[c]?.label ?? c}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{product.typeLine}</p>
            <p className="text-xs leading-relaxed text-foreground/80">{product.oracle}</p>
            <div className="pt-1">
              <p className="text-[11px] text-muted-foreground">Best local price</p>
              <p className="text-2xl font-bold text-gradient-gold">
                {cheapest ? `$${cheapest.price.toFixed(2)}` : "Unavailable"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              toggle(product.id);
              toast(saved ? "Removed from wishlist" : "Added to wishlist", {
                description: saved ? undefined : "We'll alert you on restock.",
              });
            }}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg border py-3 text-sm font-semibold transition-colors",
              saved ? "border-accent bg-accent/20 text-accent-foreground" : "border-border text-foreground",
            )}
          >
            <Heart className={cn("h-4 w-4", saved && "fill-accent text-accent")} />
            {saved ? "Wishlisted" : "Wishlist"}
          </button>
          <a
            href={cheapest ? directionsUrl(storeById(cheapest.storeId)!) : "#"}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-primary to-warning py-3 text-sm font-bold text-primary-foreground"
          >
            <Navigation className="h-4 w-4" /> Go to store
          </a>
        </div>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">Price comparison</h2>
          <p className="-mt-1 text-[11px] text-muted-foreground">
            Live stock across {listings.length} nearby stores
          </p>
          {listings.map((l) => {
            const store = storeById(l.storeId)!;
            const isBest = cheapest?.storeId === l.storeId;
            return (
              <div
                key={l.storeId}
                className={cn(
                  "rounded-xl border p-3",
                  isBest ? "border-primary bg-secondary/40" : "border-border bg-card",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <Link
                    to="/store/$storeId"
                    params={{ storeId: store.id }}
                    className="min-w-0 flex-1"
                  >
                    <p className="truncate text-sm font-semibold">{store.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {distanceKm(origin, store)} km · {l.condition} · updated {l.updatedMinutesAgo}m ago
                    </p>
                  </Link>
                  <div className="shrink-0 text-right">
                    <p className="text-base font-bold">${l.price.toFixed(2)}</p>
                    <p
                      className={cn(
                        "text-[10px] font-semibold",
                        l.stock === 0 ? "text-destructive" : l.stock <= 2 ? "text-warning" : "text-success",
                      )}
                    >
                      {l.stock === 0 ? "Out of stock" : `${l.stock} in stock`}
                    </p>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  {isBest && (
                    <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                      Best price
                    </span>
                  )}
                  {l.stock === 0 ? (
                    <button
                      type="button"
                      onClick={() => toast("Restock alert on", { description: `${store.name} · ${product.name}` })}
                      className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-semibold text-muted-foreground"
                    >
                      <Bell className="h-3 w-3" /> Notify me
                    </button>
                  ) : (
                    <a
                      href={directionsUrl(store)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-semibold text-primary"
                    >
                      <Navigation className="h-3 w-3" /> Directions
                    </a>
                  )}
                  <Link
                    to="/store/$storeId"
                    params={{ storeId: store.id }}
                    className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-semibold text-muted-foreground"
                  >
                    <StoreIcon className="h-3 w-3" /> Store profile
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
