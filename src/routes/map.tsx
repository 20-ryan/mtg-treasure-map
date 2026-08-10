import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Navigation, Clock, Phone, Crosshair, Globe } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { StoreMap } from "@/components/app/StoreMap";
import { useGeolocation } from "@/lib/geo";
import { directionsUrl, distanceKm, info, hasInfo, useCatalog, type Store } from "@/lib/mtg";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Store Map — MTG SG Finder" },
      {
        name: "description",
        content:
          "OpenStreetMap view of Singapore's three Magic: The Gathering stores — Dueller's Point, Manchi Games and Games Haven Ang Mo Kio.",
      },
      { property: "og:title", content: "Store Map — MTG SG Finder" },
      {
        property: "og:description",
        content: "Tap a marker for hours, inventory and Google Maps directions.",
      },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { coords, status } = useGeolocation();
  const { stores, inventory } = useCatalog();
  const [activeId, setActiveId] = useState<string | undefined>(undefined);

  const ranked = useMemo(
    () =>
      stores
        .map((s) => ({ store: s, distance: distanceKm(coords, s) }))
        .sort((a, b) => a.distance - b.distance),
    [stores, coords],
  );

  const active: Store | undefined = stores.find((s) => s.id === activeId) ?? ranked[0]?.store;

  return (
    <div className="pb-8">
      <PageHeader
        title="Singapore stores"
        subtitle={status === "granted" ? "Sorted by your live distance" : "Central Singapore default"}
        action={
          <span className="grid h-9 w-9 place-items-center rounded-full border border-border text-primary">
            <Crosshair className="h-4 w-4" />
          </span>
        }
      />

      <div className="space-y-4 px-4 pt-4">
        <StoreMap
          stores={stores}
          activeId={active?.id}
          user={status === "granted" ? coords : undefined}
          onSelect={(s) => setActiveId(s.id)}
          className="h-80"
        />

        {active && (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold">{active.name}</h2>
                <p className="text-[11px] text-muted-foreground">
                  {active.address}, Singapore {active.postal_code}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-primary">
                {distanceKm(coords, active)} km
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {info(active.hours)}
              </span>
              {hasInfo(active.phone) ? (
                <a href={`tel:${active.phone!.replace(/\s/g, "")}`} className="flex items-center gap-1 hover:text-primary">
                  <Phone className="h-3 w-3" /> {active.phone}
                </a>
              ) : (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {info(active.phone)}
                </span>
              )}
              {hasInfo(active.website) && (
                <a
                  href={active.website!.startsWith("http") ? active.website! : `https://${active.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-primary"
                >
                  <Globe className="h-3 w-3" /> Website
                </a>
              )}
              <span>
                {inventory.filter((l) => l.store_id === active.id && l.stock > 0).length} products in stock
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link
                to="/store/$storeId"
                params={{ storeId: active.id }}
                className="rounded-lg border border-border py-2.5 text-center text-xs font-semibold text-foreground"
              >
                View store
              </Link>
              <a
                href={directionsUrl(active)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-lg bg-linear-to-r from-primary to-warning py-2.5 text-xs font-bold text-primary-foreground"
              >
                <Navigation className="h-3.5 w-3.5" /> Get Directions
              </a>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {ranked.map(({ store, distance }) => (
            <button
              key={store.id}
              type="button"
              onClick={() => setActiveId(store.id)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors",
                store.id === active?.id ? "border-primary bg-secondary/60" : "border-border bg-card",
              )}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{store.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">{store.area}</p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-primary">{distance} km</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
