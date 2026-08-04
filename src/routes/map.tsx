import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Navigation, Star, Clock, Phone, Crosshair } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { StoreMap } from "@/components/app/StoreMap";
import { useGeolocation } from "@/lib/geo";
import { directionsUrl, distanceKm, HOME_COORDS, STORES } from "@/lib/mtg";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Store Map — MTG Store Finder" },
      {
        name: "description",
        content: "Interactive map of Magic: The Gathering game stores near you with hours, ratings and directions.",
      },
      { property: "og:title", content: "Store Map — MTG Store Finder" },
      { property: "og:description", content: "Find local game stores near you and get directions instantly." },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { coords, status } = useGeolocation();
  const origin = distanceKm(coords, HOME_COORDS) > 200 ? HOME_COORDS : coords;
  const [activeId, setActiveId] = useState<string>(STORES[0]!.id);
  const [radius, setRadius] = useState(10);

  const ranked = useMemo(
    () =>
      STORES.map((s) => ({ store: s, distance: distanceKm(origin, s) }))
        .filter((s) => s.distance <= radius)
        .sort((a, b) => a.distance - b.distance),
    [origin, radius],
  );

  const active = STORES.find((s) => s.id === activeId)!;

  return (
    <div className="pb-8">
      <PageHeader
        title="Stores near you"
        subtitle={status === "granted" ? "Using your live location" : "Downtown default location"}
        action={
          <span className="grid h-9 w-9 place-items-center rounded-full border border-border text-arcane">
            <Crosshair className="h-4 w-4" />
          </span>
        }
      />

      <div className="space-y-4 px-4 pt-4">
        <StoreMap
          user={origin}
          activeId={activeId}
          onSelect={(s) => setActiveId(s.id)}
          className="h-72"
        />

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold">{active.name}</h2>
              <p className="truncate text-[11px] text-muted-foreground">
                {active.address}, {active.city}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-primary">
              {distanceKm(origin, active)} km
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 text-primary">
              <Star className="h-3 w-3 fill-primary" /> {active.rating} ({active.reviews})
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {active.hours}
            </span>
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" /> {active.phone}
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
              <Navigation className="h-3.5 w-3.5" /> Directions
            </a>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm">
            <span>Search radius</span>
            <span className="font-semibold text-primary">{radius} km</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="mt-2 w-full accent-[oklch(0.78_0.14_84)]"
          />
        </div>

        <div className="space-y-2">
          {ranked.map(({ store, distance }) => (
            <button
              key={store.id}
              type="button"
              onClick={() => setActiveId(store.id)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors",
                store.id === activeId ? "border-primary bg-secondary/60" : "border-border bg-card",
              )}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{store.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">{store.tags.join(" · ")}</p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-primary">{distance} km</span>
            </button>
          ))}
          {ranked.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              No stores within {radius} km. Widen the radius.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
