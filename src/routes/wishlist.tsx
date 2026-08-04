import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, BellOff, Heart, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { bestListing, listingsFor, productById, storeById } from "@/lib/mtg";
import { useWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist & Restock Alerts — MTG Store Finder" },
      {
        name: "description",
        content: "Save Magic cards and sealed product, track local prices and get notified when stores restock.",
      },
      { property: "og:title", content: "Wishlist & Restock Alerts — MTG Store Finder" },
      { property: "og:description", content: "Track prices and restocks for the Magic cards you want." },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { items, remove, setNotify } = useWishlist();

  return (
    <div className="pb-10">
      <PageHeader title="Wishlist" subtitle={`${items.length} tracked items`} />

      <div className="space-y-3 px-4 pt-4">
        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <Heart className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold">Your wishlist is empty</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Tap the heart on any card to track prices and restocks.
            </p>
            <Link
              to="/search"
              className="mt-4 inline-block rounded-lg bg-linear-to-r from-primary to-warning px-4 py-2 text-xs font-bold text-primary-foreground"
            >
              Browse cards
            </Link>
          </div>
        )}

        {items.map((item) => {
          const product = productById(item.id);
          if (!product) return null;
          const best = bestListing(product.id);
          const inStock = listingsFor(product.id).filter((l) => l.stock > 0).length;

          return (
            <div key={item.id} className="flex gap-3 rounded-xl border border-border bg-card p-3">
              <Link to="/product/$productId" params={{ productId: product.id }} className="shrink-0">
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  className="h-20 w-15 rounded-lg border border-border object-cover"
                  style={{ width: "3.75rem" }}
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link to="/product/$productId" params={{ productId: product.id }}>
                  <p className="truncate text-sm font-semibold">{product.name}</p>
                  <p className="text-[11px] text-muted-foreground">{product.set}</p>
                </Link>
                <p className="mt-1 text-sm font-bold text-gradient-gold">
                  {best ? `$${best.price.toFixed(2)}` : "No local stock"}
                </p>
                <p
                  className={cn(
                    "text-[10px] font-semibold",
                    inStock > 0 ? "text-success" : "text-destructive",
                  )}
                >
                  {inStock > 0
                    ? `In stock at ${storeById(best!.storeId)?.name}`
                    : "Out of stock everywhere nearby"}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNotify(item.id, !item.notify);
                      toast(item.notify ? "Restock alerts off" : "Restock alerts on", {
                        description: product.name,
                      });
                    }}
                    className={cn(
                      "flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold",
                      item.notify ? "border-primary text-primary" : "border-border text-muted-foreground",
                    )}
                  >
                    {item.notify ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
                    {item.notify ? "Alerts on" : "Alerts off"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-semibold text-muted-foreground"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
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
