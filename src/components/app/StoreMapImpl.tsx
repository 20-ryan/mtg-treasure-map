import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Store } from "@/lib/mtg";
import { SG_CENTER } from "@/lib/mtg";

export type StoreMapProps = {
  stores: Store[];
  activeId?: string | undefined;
  user?: { lat: number; lng: number } | undefined;
  onSelect?: (store: Store) => void;
  className?: string;
};

function storeIcon(active: boolean) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:34px;height:34px;display:grid;place-items:center;border-radius:50%;
      background:${active ? "linear-gradient(135deg,#f2c14e,#c98b1c)" : "linear-gradient(135deg,#6b4fd8,#3b6fd4)"};
      border:2px solid rgba(255,255,255,.85);
      box-shadow:0 8px 20px -6px rgba(0,0,0,.8);
      font:700 15px/1 Georgia,serif;color:#12101a;">✦</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
}

const userIcon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#4da3ff;border:2px solid #fff;box-shadow:0 0 0 6px rgba(77,163,255,.25)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function Recenter({ target }: { target: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 15, { duration: 0.7 });
  }, [target, map]);
  return null;
}

export default function StoreMapImpl({
  stores,
  activeId,
  user,
  onSelect,
  className,
}: StoreMapProps) {
  const active = stores.find((s) => s.id === activeId) ?? null;

  return (
    <div className={`overflow-hidden rounded-2xl border border-border ${className ?? "h-64"}`}>
      <MapContainer
        center={[SG_CENTER.lat, SG_CENTER.lng]}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", background: "#12101a" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <Recenter target={active ? { lat: active.lat, lng: active.lng } : null} />
        {user && <Marker position={[user.lat, user.lng]} icon={userIcon} />}
        {stores.map((store) => (
          <Marker
            key={store.id}
            position={[store.lat, store.lng]}
            icon={storeIcon(store.id === activeId)}
            eventHandlers={{ click: () => onSelect?.(store) }}
          >
            <Popup>
              <strong>{store.name}</strong>
              <br />
              {store.address}, Singapore {store.postal_code}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
