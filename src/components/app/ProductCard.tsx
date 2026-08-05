import { Link } from "@tanstack/react-router";
import { Heart, Store as StoreIcon } from "lucide-react";
import { bestListing, listingsFor, productImage, storeById, type Inventory, type Product, type Store } from "@/lib/mtg";
import { useWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  inventory,
  stores,
}: {
  product: Product;
  inventory: Inventory[];
  stores: Store[];
}) {
  const { has, toggle } = useWishlist();
  const best = bestListing(inventory, product.id);
  const inStockStores = listingsFor(inventory, product.id).filter((l) => l.stock > 0).length;
  const saved = has(product.id);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/60">
      <Link to="/product/$productId" params={{ productId: product.id }} className="block">
        <div className="relative aspect-[5/7] overflow-hidden bg-muted">
          <img
            src={productImage(product)}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-card to-transparent" />
          <span className="absolute left-2 top-2 rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-primary backdrop-blur">
            {product.set_code}
          </span>
        </div>
        <div className="space-y-1.5 p-2.5">
          <p className="truncate text-sm font-semibold leading-tight">{product.name}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gradient-gold">
              {best ? `S$${best.price.toFixed(2)}` : "Out of stock"}
            </span>
            <span
              className={cn(
                "flex items-center gap-1 text-[10px]",
                inStockStores > 0 ? "text-success" : "text-muted-foreground",
              )}
            >
              <StoreIcon className="h-3 w-3" />
              {inStockStores} {inStockStores === 1 ? "store" : "stores"}
            </span>
          </div>
          {best && (
            <p className="truncate text-[10px] text-muted-foreground">
              Best at {storeById(stores, best.store_id)?.name}
            </p>
          )}
        </div>
      </Link>
      <button
        type="button"
        aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
        onClick={() => void toggle(product.id)}
        className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-background/70 backdrop-blur transition-colors hover:bg-background"
      >
        <Heart className={cn("h-4 w-4", saved ? "fill-accent text-accent" : "text-muted-foreground")} />
      </button>
    </div>
  );
}
