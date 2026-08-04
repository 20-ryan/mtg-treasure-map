import { Link } from "@tanstack/react-router";
import { Star, MapPin, Clock, Navigation } from "lucide-react";
import { directionsUrl, type Store } from "@/lib/mtg";

export function StoreCard({ store, distance }: { store: Store; distance: number }) {
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-card p-3">
      <Link
        to="/store/$storeId"
        params={{ storeId: store.id }}
        className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-secondary font-display text-lg font-bold text-primary"
      >
        {store.name
          .split(" ")
          .slice(0, 2)
          .map((w) => w[0])
          .join("")}
      </Link>
      <div className="min-w-0 flex-1">
        <Link to="/store/$storeId" params={{ storeId: store.id }} className="block min-w-0">
          <p className="truncate text-sm font-semibold">{store.name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 text-primary">
              <Star className="h-3 w-3 fill-primary" />
              {store.rating}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {distance} km
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {store.hours}
            </span>
          </div>
          <p className="mt-1 truncate text-[11px] text-muted-foreground">{store.blurb}</p>
        </Link>
      </div>
      <a
        href={directionsUrl(store)}
        target="_blank"
        rel="noreferrer"
        aria-label={`Directions to ${store.name}`}
        className="grid h-9 w-9 shrink-0 place-items-center self-center rounded-full border border-border text-primary transition-colors hover:bg-secondary"
      >
        <Navigation className="h-4 w-4" />
      </a>
    </div>
  );
}
