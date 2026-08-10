import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Navigation, Clock, Phone, MapPin, Globe, Facebook, QrCode, Star } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { ProductCard } from "@/components/app/ProductCard";
import { StoreMap } from "@/components/app/StoreMap";
import { useGeolocation } from "@/lib/geo";
import { directionsUrl, distanceKm, hasInfo, info, UNAVAILABLE, useCatalog } from "@/lib/mtg";
import { useGamification } from "@/lib/gamification";

export const Route = createFileRoute("/store/$storeId")({
  head: () => ({
    meta: [
      { title: "Store Profile — MTG SG Finder" },
      { name: "description", content: "Opening hours, contact details, directions and live Magic inventory." },
      { property: "og:title", content: "Store Profile — MTG SG Finder" },
      { property: "og:description", content: "Live Magic inventory at Singapore game stores." },
    ],
  }),
  component: StorePage,
});

function Row({ icon: Icon, children }: { icon: typeof MapPin; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <Icon className="h-3 w-3 shrink-0" /> {children}
    </span>
  );
}

function StorePage() {
  const { storeId } = Route.useParams();
  const { coords } = useGeolocation();
  const { stores, products, inventory, isLoading } = useCatalog();
  const { checkIn, signedIn } = useGamification();

  const store = stores.find((s) => s.id === storeId);
  if (isLoading) return <p className="p-10 text-center text-xs text-muted-foreground">Loading…</p>;
  if (!store) return <p className="p-10 text-center text-sm">Store not found.</p>;

  const stocked = products.filter((p) =>
    inventory.some((l) => l.store_id === store.id && l.product_id === p.id && l.stock > 0),
  );
  const featured = stocked.slice(0, 4);

  async function handleCheckIn() {
    if (!store) return;
    try {
      const res = await checkIn(store.id);
      toast.success(res.repeat ? "Already checked in here today." : `Checked in · +${res.xp} XP`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Check-in failed.");
    }
  }

  return (
    <div className="pb-10">
      <PageHeader title={store.name} subtitle={`${store.area} · ${distanceKm(coords, store)} km away`} back />

      <div className="space-y-6 px-4 pt-4">
        <div className="rounded-2xl border border-border bg-linear-to-br from-secondary to-card p-4">
          <div className="flex flex-col gap-1.5 text-[11px] text-muted-foreground">
            <Row icon={MapPin}>
              {store.address}, Singapore {store.postal_code}
            </Row>
            <Row icon={Clock}>{info(store.hours)}</Row>
            {hasInfo(store.phone) ? (
              <a href={`tel:${store.phone!.replace(/\s/g, "")}`} className="hover:text-primary">
                <Row icon={Phone}>{store.phone}</Row>
              </a>
            ) : (
              <Row icon={Phone}>{UNAVAILABLE}</Row>
            )}
            {hasInfo(store.website) ? (
              <a
                href={store.website!.startsWith("http") ? store.website! : `https://${store.website}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary"
              >
                <Row icon={Globe}>{store.website!.replace(/^https?:\/\//, "")}</Row>
              </a>
            ) : (
              <Row icon={Globe}>{UNAVAILABLE}</Row>
            )}
            {hasInfo(store.facebook) && (
              <a href={store.facebook!} target="_blank" rel="noreferrer" className="hover:text-primary">
                <Row icon={Facebook}>Facebook</Row>
              </a>
            )}
            <Row icon={Star}>{store.rating ? `${store.rating} rating` : UNAVAILABLE}</Row>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <a
              href={directionsUrl(store)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg bg-linear-to-r from-primary to-warning py-3 text-sm font-bold text-primary-foreground"
            >
              <Navigation className="h-4 w-4" /> Get Directions
            </a>
            {signedIn ? (
              <button
                type="button"
                onClick={() => void handleCheckIn()}
                className="flex items-center justify-center gap-2 rounded-lg border border-primary py-3 text-sm font-semibold text-primary"
              >
                <QrCode className="h-4 w-4" /> Check in +20 XP
              </button>
            ) : (
              <Link
                to="/account"
                className="flex items-center justify-center gap-2 rounded-lg border border-border py-3 text-sm font-semibold"
              >
                <QrCode className="h-4 w-4" /> Sign in to check in
              </Link>
            )}
          </div>
        </div>

        <StoreMap stores={[store]} activeId={store.id} className="h-48" />

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
            <h2 className="text-base font-semibold">Current inventory</h2>
            <p className="text-[11px] text-muted-foreground">
              {stocked.length > 0 ? `${stocked.length} products available` : UNAVAILABLE}
            </p>
          </div>
          {stocked.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {stocked.map((p) => (
                <ProductCard key={p.id} product={p} inventory={inventory} stores={stores} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              This store has not published live stock yet — {UNAVAILABLE.toLowerCase()}.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
