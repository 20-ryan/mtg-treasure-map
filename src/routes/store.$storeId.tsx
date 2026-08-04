import { createFileRoute, notFound } from "@tanstack/react-router";
import { Navigation, Star, Clock, Phone, MapPin, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { ProductCard } from "@/components/app/ProductCard";
import { StoreMap } from "@/components/app/StoreMap";
import { useGeolocation } from "@/lib/geo";
import { directionsUrl, distanceKm, HOME_COORDS, listingsFor, PRODUCTS, storeById } from "@/lib/mtg";

export const Route = createFileRoute("/store/$storeId")({
  loader: ({ params }) => {
    const store = storeById(params.storeId);
    if (!store) throw notFound();
    return { store };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Store not found — MTG Store Finder" }, { name: "robots", content: "noindex" }] };
    }
    const { store } = loaderData;
    return {
      meta: [
        { title: `${store.name} — Magic Cards & Events | MTG Store Finder` },
        { name: "description", content: `${store.blurb} Live Magic inventory, opening hours and directions.` },
        { property: "og:title", content: `${store.name} — MTG Store Finder` },
        { property: "og:description", content: store.blurb },
      ],
    };
  },
  component: StorePage,
});

function StorePage() {
  const { store } = Route.useLoaderData();
  const { coords } = useGeolocation();
  const origin = distanceKm(coords, HOME_COORDS) > 200 ? HOME_COORDS : coords;

  const stocked = PRODUCTS.filter((p) =>
    listingsFor(p.id).some((l) => l.storeId === store.id && l.stock > 0),
  );

  return (
    <div className="pb-10">
      <PageHeader title={store.name} subtitle={`${store.city} · ${distanceKm(origin, store)} km away`} back />

      <div className="space-y-6 px-4 pt-4">
        <div className="rounded-2xl border border-border bg-linear-to-br from-secondary to-card p-4">
          <p className="text-sm text-foreground/85">{store.blurb}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 text-primary">
              <Star className="h-3 w-3 fill-primary" /> {store.rating} ({store.reviews} reviews)
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {store.hours}
            </span>
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" /> {store.phone}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {store.address}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {store.tags.map((t: string) => (
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

        <StoreMap user={origin} activeId={store.id} className="h-48" />

        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <CalendarDays className="h-4 w-4 text-primary" /> Weekly events
          </h2>
          <div className="space-y-2">
            {store.events.map((e: { day: string; name: string; format: string }) => (
              <div key={e.name} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-[11px] font-bold text-primary">
                  {e.day}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{e.name}</p>
                  <p className="text-[11px] text-muted-foreground">{e.format}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold">In stock now</h2>
            <p className="text-[11px] text-muted-foreground">{stocked.length} products available</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {stocked.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
