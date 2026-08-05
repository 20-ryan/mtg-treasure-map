import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, BellOff, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { bestListing, productImage, useCatalog } from "@/lib/mtg";
import { useWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist & Restock Alerts — MTG SG Finder" },
      { name: "description", content: "Save Magic cards and products and get alerted when Singapore stores restock." },
      { property: "og:title", content: "Wishlist — MTG SG Finder" },
      { property: "og:description", content: "Restock alerts for Singapore Magic stores." },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { items, remove, setNotify, signedIn } = useWishlist();
  const { products, stores, inventory } = useCatalog();

  const rows = items
    .map((i) => ({ entry: i, product: products.find((p) => p.id === i.id) }))
    .filter((r): r is { entry: typeof items[number]; product: NonNullable<typeof r.product> } => Boolean(r.product));

  return (
    <div className="pb-10">
      <PageHeader
        title="Wishlist"
        subtitle={signedIn ? `${items.length} saved · synced to your account` : `${items.length} saved on this device`}
      />

      <div className="space-y-3 px-4 pt-4">
        {!signedIn && (
          <Link
            to="/account"
            className="block rounded-xl border border-primary/40 bg-card p-3 text-xs text-muted-foreground"
          >
            <span className="font-semibold text-primary">Sign in</span> to sync your wishlist and get restock alerts.
          </Link>
        )}

        {rows.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-xs text-muted-foreground">
            Nothing saved yet. Tap the heart on any product.
          </p>
        )}

        {rows.map(({ entry, product }) => {
          const best = bestListing(inventory, product.id);
          const store = best ? stores.find((s) => s.id === best.store_id) : null;
          return (
            <div key={product.id} className="flex gap-3 rounded-xl border border-border bg-card p-3">
              <Link to="/product/$productId" params={{ productId: product.id }} className="shrink-0">
                <img src={productImage(product)} alt={product.name} className="h-20 w-14 rounded-lg object-cover" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link to="/product/$productId" params={{ productId: product.id }} className="block min-w-0">
                  <p className="truncate text-sm font-semibold">{product.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{product.set_name}</p>
                </Link>
                <p className={cn("mt-1 text-xs font-bold", best ? "text-gradient-gold" : "text-muted-foreground")}>
                  {best ? `S$${best.price.toFixed(2)} · ${store?.name}` : "Out of stock everywhere"}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void setNotify(product.id, !entry.notify)}
                    className={cn(
                      "flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold",
                      entry.notify ? "border-primary text-primary" : "border-border text-muted-foreground",
                    )}
                  >
                    {entry.notify ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
                    {entry.notify ? "Alerts on" : "Alerts off"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(product.id)}
                    aria-label="Remove"
                    className="grid h-7 w-7 place-items-center rounded-lg border border-border text-muted-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
