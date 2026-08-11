import { useEffect, useRef, useState } from "react";

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

export function useStoreGeofence(radiusMeters = 100) {
  const [arrivedStore, setArrivedStore] = useState<StoreLocation | null>(null);
  const notified = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
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
            if (notified.current[store.id]) continue;
            notified.current[store.id] = true;
            setArrivedStore(store);
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(`You've arrived at ${store.name}! 🎯`, {
                body: "Open the app, check in via QR code and claim +20 XP.",
                icon: "/favicon.ico",
              });
            }
          } else if (distance > radiusMeters * 2) {
            // Re-arm once the player leaves the area.
            notified.current[store.id] = false;
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