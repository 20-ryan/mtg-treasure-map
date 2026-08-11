import { useEffect, useRef, useState } from "react";

const COOLDOWN_MS = 4 * 60 * 60 * 1000; // one arrival alert per store per 4 hours
const STORAGE_KEY = "mtgsg.geofence.lastAlert";

export interface StoreLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

/** The only three stores in the app — ids match the backend store ids. */
export const GEOFENCE_STORES: StoreLocation[] = [
  { id: "duellers-point", name: "Dueller's Point", latitude: 1.3793642, longitude: 103.8955846 },
  { id: "manchi-games", name: "Manchi Games", latitude: 1.362059, longitude: 103.8427318 },
  { id: "games-haven-amk", name: "Games Haven – Ang Mo Kio", latitude: 1.3693645, longitude: 103.8472373 },
];

/** Haversine distance in meters. */
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function readCooldowns(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

function writeCooldowns(map: Record<string, number>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* storage unavailable — in-memory cooldown still applies */
  }
}

export function useStoreGeofence(radiusMeters = 100) {
  const [arrivedStore, setArrivedStore] = useState<StoreLocation | null>(null);
  const inside = useRef<Record<string, boolean>>({});
  const lastAlert = useRef<Record<string, number>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    lastAlert.current = readCooldowns();
    if ("Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission();
    }
    if (!("geolocation" in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        for (const store of GEOFENCE_STORES) {
          const distance = calculateDistanceMeters(latitude, longitude, store.latitude, store.longitude);
          if (distance <= radiusMeters) {
            if (inside.current[store.id]) continue;
            inside.current[store.id] = true;
            const last = lastAlert.current[store.id] ?? 0;
            if (Date.now() - last < COOLDOWN_MS) continue;
            lastAlert.current[store.id] = Date.now();
            writeCooldowns(lastAlert.current);
            setArrivedStore(store);
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(`You've Arrived at ${store.name}!`, {
                body: "Open the app, scan the store QR code and claim +20 XP.",
                tag: `arrival-${store.id}`,
                icon: "/favicon.ico",
              });
            }
          } else if (distance > radiusMeters * 2) {
            // Left the area — re-arm arrival detection (cooldown still applies).
            inside.current[store.id] = false;
          }
        }
      },
      (error) => console.warn("Geofence error:", error),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [radiusMeters]);

  return { arrivedStore, dismissArrival: () => setArrivedStore(null) };
}