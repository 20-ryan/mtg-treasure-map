import { useEffect, useRef, useState } from "react";
import { SG_CENTER, type Store } from "@/lib/mtg";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google?: typeof globalThis & { maps: any };
    __mtgMapReady?: () => void;
  }
}

const BROWSER_KEY = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"] as string | undefined;
const CHANNEL = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"] as string | undefined;

let loaderPromise: Promise<void> | null = null;

function loadMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if ((window as any).google?.maps?.Map) return Promise.resolve();
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise<void>((resolve, reject) => {
    if (!BROWSER_KEY) {
      reject(new Error("Missing Google Maps browser key"));
      return;
    }
    window.__mtgMapReady = () => resolve();
    const script = document.createElement("script");
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${BROWSER_KEY}&loading=async&callback=__mtgMapReady` +
      (CHANNEL ? `&channel=${CHANNEL}` : "");
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
  return loaderPromise;
}

/* Gold planeswalker-style pin for stores, arcane dot for the player. */
function pinIcon(google: any, active: boolean) {
  return {
    path: "M12 0C6.9 0 2.8 4.1 2.8 9.2 2.8 16.1 12 26 12 26s9.2-9.9 9.2-16.8C21.2 4.1 17.1 0 12 0z",
    fillColor: active ? "#f5c451" : "#8b5cf6",
    fillOpacity: 1,
    strokeColor: "#0d0b14",
    strokeWeight: 2,
    scale: active ? 1.5 : 1.2,
    anchor: new google.maps.Point(12, 26),
    labelOrigin: new google.maps.Point(12, 9),
  };
}

const DARK_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#15131f" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#15131f" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8f88a8" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#241f33" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#6f6788" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d1526" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#191527" }] },
];

export function GoogleStoreMap({
  stores,
  activeId,
  user,
  onSelect,
  className,
}: {
  stores: Store[];
  activeId?: string | undefined;
  user?: { lat: number; lng: number } | undefined;
  onSelect?: ((store: Store) => void) | undefined;
  className?: string | undefined;
}) {
  const container = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const userMarkerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadMaps()
      .then(() => {
        if (cancelled || !container.current) return;
        const google = (window as any).google;
        mapRef.current = new google.maps.Map(container.current, {
          center: SG_CENTER,
          zoom: 12.4,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
          styles: DARK_STYLE,
        });
        setReady(true);
      })
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const google = (window as any).google;
    Object.values(markersRef.current).forEach((m: any) => m.setMap(null));
    markersRef.current = {};

    const bounds = new google.maps.LatLngBounds();
    stores.forEach((store) => {
      const marker = new google.maps.Marker({
        position: { lat: store.lat, lng: store.lng },
        map: mapRef.current,
        title: store.name,
        icon: pinIcon(google, store.id === activeId),
        zIndex: store.id === activeId ? 10 : 1,
      });
      marker.addListener("click", () => onSelect?.(store));
      markersRef.current[store.id] = marker;
      bounds.extend(marker.getPosition()!);
    });

    if (user) {
      userMarkerRef.current?.setMap(null);
      userMarkerRef.current = new google.maps.Marker({
        position: user,
        map: mapRef.current,
        title: "You",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 6,
          fillColor: "#60a5fa",
          fillOpacity: 1,
          strokeColor: "#0d0b14",
          strokeWeight: 2,
        },
      });
      bounds.extend(userMarkerRef.current.getPosition()!);
    }

    if (stores.length > 1) {
      mapRef.current.fitBounds(bounds, 56);
    } else if (stores.length === 1) {
      mapRef.current.setCenter({ lat: stores[0]!.lat, lng: stores[0]!.lng });
      mapRef.current.setZoom(16);
    }
  }, [ready, stores, activeId, user, onSelect]);

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-border bg-card", className)}>
      <div ref={container} className="h-full w-full" />
      {(!ready || error) && (
        <div className="absolute inset-0 grid place-items-center bg-card/90 px-6 text-center text-xs text-muted-foreground">
          {error ? `Map unavailable — ${error}` : "Loading Singapore map…"}
        </div>
      )}
    </div>
  );
}
