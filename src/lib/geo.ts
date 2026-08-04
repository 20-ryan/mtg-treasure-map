import { useEffect, useState } from "react";
import { HOME_COORDS } from "./mtg";

export type Coords = { lat: number; lng: number };
export type GeoState = "idle" | "locating" | "granted" | "denied";

export function useGeolocation() {
  const [coords, setCoords] = useState<Coords>(HOME_COORDS);
  const [status, setStatus] = useState<GeoState>("idle");

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("granted");
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  }, []);

  return { coords, status };
}
