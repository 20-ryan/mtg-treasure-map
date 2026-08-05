import { createFileRoute } from "@tanstack/react-router";
import { Navigation, Clock, Phone, MapPin, Globe, Facebook } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { ProductCard } from "@/components/app/ProductCard";
import { GoogleStoreMap } from "@/components/app/GoogleStoreMap";
import { useGeolocation } from "@/lib/geo";
import { directionsUrl, distanceKm, useCatalog } from "@/lib/mtg";

export const Route = createFileRoute("/store/$storeId")({
  head: () => ({
    meta: [
      { title: "Store — MTG SG Finder" },
      { name: "description", content: "Opening hours, contact details, directions and live Magic inventory." },
      { property: "og:title", content: "Store — MTG SG Finder" },
      { property: "og:description", content: "Live Magic inventory at Singapore game stores." },
    ],
  }),
  component: StorePage,
});

function StorePage() {
  const { storeId } = Route.useParams();
  const { coords } = useGeolocation();
  const { stores, products, inventory, isLoading } = useCatalog();

  const store = stores.find((s) => s.id === storeId);
  if (isLoading) return <p className="p-10 text-center text-xs text-muted-foreground">Loading…</p>;
  if (!store) return <p className="p-10 text-center text-sm">Store not found.</p>;

  const stocked = products.filter((p) =>
    inventory.some((l) => l.store_id === store.id && l.product_id === p.id && l.stock > 0),
  );
  const featured = stocked.slice(0, 4);

  return (
    <div className="pb-10">
      <PageHeader title={store.name} subtitle={`${store.area} · ${distanceKm(coords, store)} km away`} back />

      <div className="space-y-6 px-4 pt-4">
        <div className="rounded-2xl border border-border bg-linear-to-br from-secondary to-card p-4">
          <p className="text-sm text-foreground/85">{store.blurb}</p>
          <div className="mt-3 flex flex-col gap-1.5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3" /> {store.address}, Singapore {store.postal_code}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" /> {store.hours}
            </span>
            {store.phone && (
              <a href={`tel:${store.phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 hover:text-primary">
                <Phone className="h-3 w-3" /> {store.phone}
              </a>
            )}
            {store.website && (
              <a
                href={store.website.startsWith("http") ? store.website : `https://${store.website}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 hover:text-primary"
              >
                <Globe className="h-3 w-3" /> {store.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            {store.facebook && (
              <a href={store.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-primary">
                <Facebook className="h-3 w-3" /> Facebook
              </a>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {store.tags.map((t) => (
              <span key={t} className="rounded-full bg-background/50 px-2.5 py-1 text-[10px] font-semibold text-primary">
                {t}
              </span>
            ))}
          </div>
          <a
            href={directionsUrl(store)}
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-primary to-warning py-3 text-sm font-bold text-primary-foreground"
          >
            <Navigation className="h-4 w-4" /> Get directions
          </a>
        </div>

        <GoogleStoreMap stores={[store]} activeId={store.id} className="h-48" />

        {featured.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-semibold">Featured products</h2>
            <div className="grid grid-cols-2 gap-3">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} inventory={inventory} stores={stores} />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold">In stock now</h2>
            <p className="text-[11px] text-muted-foreground">{stocked.length} products available</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {stocked.map((p) => (
              <ProductCard key={p.id} product={p} inventory={inventory} stores={stores} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
