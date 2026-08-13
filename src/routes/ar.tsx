import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  X,
  Camera,
  Compass,
  Sparkles,
  Gem,
  Loader2,
  MapPin,
  ExternalLink,
  QrCode,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ArParticles, useCameraStream } from "@/components/app/ArCamera";
import { identifyCard } from "@/lib/scan.functions";
import { useCollection, useCollectionActions, levelFromXp, type ScannedCard } from "@/lib/collection";
import { useProfile } from "@/lib/collection";
import { useGeolocation } from "@/lib/geo";
import { directionsUrl, distanceKm, useCatalog, type Store } from "@/lib/mtg";
import { useAchievements, useUnlockedAchievements, levelTitle } from "@/lib/gamification";
import {
  AR_XP,
  bearingTo,
  compassLabel,
  relativeBearing,
  useArActions,
  useArCollectibles,
  useArDiscoveries,
  useDeviceHeading,
  type ArCollectible,
} from "@/lib/ar";

export const Route = createFileRoute("/ar")({
  head: () => ({
    meta: [
      { title: "AR Collector Mode — MTG SG Finder" },
      {
        name: "description",
        content:
          "Point your camera at Magic cards, find Singapore game stores with AR markers, check in for XP and hunt AR collectibles.",
      },
      { property: "og:title", content: "AR Collector Mode — MTG SG Finder" },
      {
        property: "og:description",
        content: "Card recognition, AR store finder, AR check-ins and collectible hunting in one camera view.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ArPage,
});

type ArMode = "card" | "stores" | "collect" | "collection";

const TABS: { id: ArMode; label: string; icon: typeof Camera }[] = [
  { id: "card", label: "Scan Card", icon: Camera },
  { id: "stores", label: "Store Finder", icon: Compass },
  { id: "collect", label: "Collect", icon: Gem },
  { id: "collection", label: "Collection", icon: Layers },
];

const RARITY_GLOW: Record<string, string> = {
  common: "shadow-[0_0_40px_-8px_oklch(0.7_0.05_260)] border-slate-400/50",
  uncommon: "shadow-[0_0_40px_-6px_oklch(0.72_0.1_200)] border-sky-300/60",
  rare: "shadow-[0_0_46px_-6px_oklch(0.8_0.13_85)] border-amber-300/70",
  mythic: "shadow-[0_0_52px_-4px_oklch(0.72_0.19_45)] border-orange-400/80",
  special: "shadow-[0_0_52px_-4px_oklch(0.65_0.2_300)] border-fuchsia-400/70",
};

function ArPage() {
  const [mode, setMode] = useState<ArMode>("card");
  const { videoRef, ready, error, capture } = useCameraStream(true);
  const { data: profile } = useProfile();
  const progress = levelFromXp(profile?.xp ?? 0);

  return (
    <div className="fixed inset-0 z-50 mx-auto max-w-lg overflow-hidden bg-black text-foreground">
      <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,transparent_35%,rgba(0,0,0,0.75))]" />

      {!ready && (
        <div className="absolute inset-0 grid place-items-center px-8 text-center">
          {error ? (
            <div className="surface-glass rounded-2xl border border-primary/40 p-5">
              <Camera className="mx-auto h-10 w-10 text-primary" strokeWidth={1.4} />
              <p className="mt-3 text-xs text-muted-foreground">{error}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Scanner, map, store finder and collection all still work without AR.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Link to="/scan" className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">
                  Open scanner
                </Link>
                <Link to="/map" className="rounded-lg border border-border px-3 py-2 text-xs font-semibold">
                  Open map
                </Link>
              </div>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Starting AR camera…
            </p>
          )}
        </div>
      )}

      {/* top HUD */}
      <div className="absolute inset-x-0 top-0 flex items-center gap-3 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="surface-glass min-w-0 flex-1 rounded-xl px-3 py-2">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest">
            <span className="text-primary">Lv {progress.level} · {levelTitle(progress.level)}</span>
            <span className="text-muted-foreground">{profile?.xp ?? 0} XP</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-linear-to-r from-primary to-warning transition-all duration-700"
              style={{ width: `${Math.round((progress.into / progress.need) * 100)}%` }}
            />
          </div>
        </div>
        <Link
          to="/"
          aria-label="Exit AR mode"
          className="surface-glass grid h-10 w-10 shrink-0 place-items-center rounded-full text-primary"
        >
          <X className="h-5 w-5" />
        </Link>
      </div>

      {/* mode content */}
      <div className="absolute inset-x-0 bottom-24 top-20 overflow-hidden">
        {mode === "card" && <ArCardMode capture={capture} cameraReady={ready} />}
        {mode === "stores" && <ArStoreFinder />}
        {mode === "collect" && <ArCollectMode />}
        {mode === "collection" && <ArCollectionMode />}
      </div>

      {/* bottom tabs */}
      <nav className="absolute inset-x-0 bottom-0 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="surface-glass grid grid-cols-4 gap-1 rounded-2xl p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition-colors",
                mode === id
                  ? "bg-linear-to-r from-primary to-warning text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

/* ---------------- 1 + 2. card recognition & showcase ---------------- */

function ArCardMode({ capture, cameraReady }: { capture: (max?: number) => string | null; cameraReady: boolean }) {
  const run = useServerFn(identifyCard);
  const { addCard, signedIn } = useCollectionActions();
  const { awardXp } = useArActions();
  const { data: cards = [] } = useCollection();
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState<ScannedCard | null>(null);
  const [showcase, setShowcase] = useState(false);
  const [xpGained, setXpGained] = useState(0);

  const owned = useMemo(() => {
    if (!card) return 0;
    return cards
      .filter((c) => c.card_name.toLowerCase() === card.card_name.toLowerCase())
      .reduce((n, c) => n + c.quantity, 0);
  }, [cards, card]);

  async function scan() {
    const frame = capture();
    if (!frame) {
      toast.error("Camera frame unavailable — try again.");
      return;
    }
    setBusy(true);
    setShowcase(false);
    try {
      const found = await run({ data: { image: frame } });
      setCard(found);
      const isNew = !cards.some((c) => c.card_name.toLowerCase() === found.card_name.toLowerCase());
      const xp = AR_XP.scanCard + (isNew ? AR_XP.identifyNewCard : 0);
      setXpGained(xp);
      if (signedIn) await awardXp(xp);
      toast.success(`${found.card_name} recognised · +${xp} XP`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Recognition failed.");
    } finally {
      setBusy(false);
    }
  }

  async function add() {
    if (!card) return;
    try {
      const { duplicate, xp } = await addCard(card);
      toast.success(duplicate ? `Quantity increased · +${xp} XP` : `Added to collection · +${xp} XP`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save that card.");
    }
  }

  async function openShowcase() {
    setShowcase(true);
    setXpGained((v) => v + AR_XP.showcase);
    if (signedIn) await awardXp(AR_XP.showcase);
  }

  const rarityGlow = RARITY_GLOW[(card?.rarity ?? "common").toLowerCase()] ?? RARITY_GLOW['common']!;

  return (
    <div className="relative h-full">
      {/* recognition frame */}
      <div
        className={cn(
          "absolute left-1/2 top-6 h-64 w-44 -translate-x-1/2 overflow-hidden rounded-xl border-2 transition-all duration-500",
          card ? cn("border-solid", rarityGlow) : "border-dashed border-primary/70",
        )}
      >
        {!card && (
          <div className="absolute inset-x-0 h-1/3 bg-linear-to-b from-transparent via-primary/30 to-transparent ar-scanline" />
        )}
        {card && <ArParticles count={12} />}
      </div>

      {!card && (
        <p className="absolute inset-x-8 top-[19rem] text-center text-[11px] text-muted-foreground">
          Hold a Magic card inside the frame and tap Recognise.
        </p>
      )}

      {/* floating showcase above the physical card */}
      {card && showcase && (
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2">
          <div className={cn("ar-float rounded-xl border-2 p-1", rarityGlow)}>
            {card.image_url ? (
              <img src={card.image_url} alt={card.card_name} className="h-52 w-36 rounded-lg object-cover" />
            ) : (
              <div className="grid h-52 w-36 place-items-center rounded-lg bg-card text-center text-[10px]">
                {card.card_name}
              </div>
            )}
          </div>
          <ArParticles count={16} />
        </div>
      )}

      {/* recognition overlay panel */}
      {card && (
        <div className="ar-pop surface-glass absolute inset-x-3 bottom-16 rounded-2xl border border-primary/50 p-4 mythic-ring">
          <p className="font-display text-base font-bold text-gradient-gold">{card.card_name}</p>
          <p className="text-[11px] text-muted-foreground">
            {card.set_name || card.set_code || "Set unavailable"}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wider">
            <span className="rounded-full border border-primary/50 px-2 py-0.5 text-primary">{card.rarity}</span>
            <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">
              {owned > 0 ? `Owned: ${owned} ${owned === 1 ? "copy" : "copies"}` : "Not in collection"}
            </span>
            {xpGained > 0 && (
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-primary">+{xpGained} XP</span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => void add()}
              disabled={!signedIn}
              className="rounded-lg bg-linear-to-r from-primary to-warning py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
            >
              Add to collection
            </button>
            <button
              type="button"
              onClick={() => void openShowcase()}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-primary/50 py-2 text-xs font-semibold text-primary"
            >
              <Sparkles className="h-3.5 w-3.5" /> AR showcase
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => void scan()}
        disabled={busy || !cameraReady}
        className="absolute inset-x-16 bottom-2 rounded-xl bg-linear-to-r from-primary to-warning py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
      >
        {busy ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Recognising…
          </span>
        ) : (
          "Recognise card"
        )}
      </button>
    </div>
  );
}

/* ---------------- 3 + 4. AR store finder & check-in ---------------- */

function ArStoreFinder() {
  const { stores, inventory } = useCatalog();
  const { coords } = useGeolocation();
  const { heading, requestPermission } = useDeviceHeading();
  const { arCheckIn, signedIn } = useArActions();
  const [selected, setSelected] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    void requestPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markers = useMemo(
    () =>
      stores.map((s) => {
        const bearing = bearingTo(coords, s);
        const rel = relativeBearing(bearing, heading ?? 0);
        const stock = inventory.filter((i) => i.store_id === s.id && i.stock > 0).length;
        return { store: s, distance: distanceKm(coords, s), bearing, rel, stock };
      }),
    [stores, coords, heading, inventory],
  );

  const active = markers.find((m) => m.store.id === selected);

  async function doCheckIn(store: Store) {
    setChecking(true);
    try {
      const res = await arCheckIn(store.id);
      if (res.cooldown) toast.info(`You already checked in at ${store.name}. Try again later.`);
      else {
        toast.success(`Store Check-In Complete! ${store.name} · +${res.xp} XP`);
        for (const a of res.unlocked) toast.success(`Achievement unlocked: ${a.name} · +${a.xp_reward} XP`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Check-in failed.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="relative h-full">
      {markers.map(({ store, distance, bearing, rel, stock }) => {
        const visible = Math.abs(rel) < 75;
        const x = 50 + Math.max(-46, Math.min(46, (rel / 75) * 46));
        const y = 20 + Math.min(40, distance * 4);
        return (
          <button
            key={store.id}
            type="button"
            onClick={() => setSelected(store.id)}
            style={{ left: `${x}%`, top: `${y}%` }}
            className={cn(
              "surface-glass absolute -translate-x-1/2 rounded-xl border border-primary/50 px-3 py-2 text-left transition-opacity duration-300",
              visible ? "opacity-100" : "opacity-40",
            )}
          >
            <span className="flex items-center gap-1.5 text-xs font-bold text-primary">
              <MapPin className="h-3.5 w-3.5" /> {store.name}
            </span>
            <span className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
              {distance} km
              <span className="text-primary">{compassLabel(bearing)} {rel > 0 ? "→" : "←"}</span>
              <span className={cn("flex items-center gap-1", stock > 0 ? "text-success" : "text-muted-foreground")}>
                <span className={cn("h-1.5 w-1.5 rounded-full", stock > 0 ? "bg-success" : "bg-muted-foreground")} />
                {stock > 0 ? `${stock} in stock` : "Stock unavailable"}
              </span>
            </span>
          </button>
        );
      })}

      {heading === null && (
        <p className="absolute inset-x-8 bottom-2 text-center text-[10px] text-muted-foreground">
          Compass unavailable on this device — markers use a fixed north heading.
        </p>
      )}

      {active && (
        <div className="ar-pop surface-glass absolute inset-x-3 bottom-2 rounded-2xl border border-primary/50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display text-sm font-bold text-gradient-gold">{active.store.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{active.store.address}</p>
              <p className="mt-1 text-[11px] text-primary">
                {active.distance} km · {compassLabel(active.bearing)}
              </p>
            </div>
            <button type="button" onClick={() => setSelected(null)} aria-label="Close" className="text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              to="/store/$storeId"
              params={{ storeId: active.store.id }}
              className="rounded-lg border border-border py-2 text-center text-xs font-semibold"
            >
              Store profile
            </Link>
            <a
              href={directionsUrl(active.store)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-semibold"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Google Maps
            </a>
          </div>
          <button
            type="button"
            disabled={!signedIn || checking || active.distance > 0.3}
            onClick={() => void doCheckIn(active.store)}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-primary to-warning py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
          >
            <QrCode className="h-4 w-4" />
            {active.distance > 0.3 ? "Get closer to check in" : `AR check-in (+${AR_XP.checkIn} XP)`}
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- 5. AR collectible hunting ---------------- */

const ICON_TINT: Record<string, string> = {
  shard: "from-sky-400/70 to-blue-700/70",
  fragment: "from-fuchsia-400/70 to-purple-700/70",
  crystal: "from-amber-300/80 to-yellow-600/70",
};

function ArCollectMode() {
  const { stores } = useCatalog();
  const { coords } = useGeolocation();
  const { data: collectibles = [] } = useArCollectibles();
  const { data: discovered = [] } = useArDiscoveries();
  const { discover, signedIn } = useArActions();
  const [collecting, setCollecting] = useState<string | null>(null);
  const [burst, setBurst] = useState<ArCollectible | null>(null);

  const nearest = useMemo(() => {
    const sorted = stores
      .map((s) => ({ store: s, distance: distanceKm(coords, s) }))
      .sort((a, b) => a.distance - b.distance);
    return sorted[0];
  }, [stores, coords]);

  const inRange = !!nearest && nearest.distance <= 0.3;
  const found = new Set(discovered.map((d) => d.collectible_id));
  const here = nearest ? collectibles.filter((c) => c.store_id === nearest.store.id) : [];

  async function collect(c: ArCollectible) {
    setCollecting(c.id);
    try {
      const res = await discover(c);
      if (!res) {
        toast.info(`${c.name} already discovered.`);
        return;
      }
      setBurst(c);
      setTimeout(() => setBurst(null), 1800);
      toast.success(`${c.name} collected · +${res.xp} XP`);
      for (const a of res.unlocked) toast.success(`Achievement unlocked: ${a.name} · +${a.xp_reward} XP`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not collect that.");
    } finally {
      setCollecting(null);
    }
  }

  return (
    <div className="relative h-full">
      {here.map((c, i) => {
        const isFound = found.has(c.id);
        const x = 18 + ((i * 31) % 64);
        const y = 18 + ((i * 23) % 52);
        return (
          <button
            key={c.id}
            type="button"
            disabled={!inRange || !signedIn || isFound || collecting === c.id}
            onClick={() => void collect(c)}
            style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.4}s` }}
            className={cn(
              "ar-float absolute -translate-x-1/2 text-center disabled:opacity-45",
              isFound && "grayscale",
            )}
          >
            <span
              className={cn(
                "relative grid h-16 w-16 place-items-center rounded-full bg-linear-to-br shadow-[0_0_30px_-4px_hsl(var(--primary)/0.9)]",
                ICON_TINT[c.icon] ?? ICON_TINT['shard'],
              )}
            >
              {isFound ? <CheckCircle2 className="h-7 w-7" /> : <Gem className="h-7 w-7" />}
            </span>
            <span className="mt-1 block text-[10px] font-semibold text-primary">{c.name}</span>
            <span className="block text-[9px] text-muted-foreground">+{c.xp_reward} XP</span>
          </button>
        );
      })}

      {burst && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="ar-pop surface-glass rounded-2xl border border-primary/60 px-5 py-4 text-center mythic-ring">
            <p className="font-display text-sm font-bold text-gradient-gold">{burst.name}</p>
            <p className="text-[11px] text-muted-foreground">+{burst.xp_reward} XP</p>
          </div>
          <ArParticles count={20} />
        </div>
      )}

      <div className="surface-glass absolute inset-x-3 bottom-2 rounded-2xl border border-border p-3 text-center">
        {!nearest ? (
          <p className="text-[11px] text-muted-foreground">Loading participating stores…</p>
        ) : inRange ? (
          <p className="text-[11px] text-muted-foreground">
            You're at <span className="text-primary">{nearest.store.name}</span> — pan your camera and tap the
            collectibles you find.
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            Nearest store: <span className="text-primary">{nearest.store.name}</span> · {nearest.distance} km away.
            AR collectibles unlock when you arrive.
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------------- 6. AR collection & achievements ---------------- */

function ArCollectionMode() {
  const { data: collectibles = [] } = useArCollectibles();
  const { data: discovered = [] } = useArDiscoveries();
  const { data: achievements = [] } = useAchievements();
  const { data: unlocked = [] } = useUnlockedAchievements();
  const { stores } = useCatalog();

  const found = new Set(discovered.map((d) => d.collectible_id));
  const unlockedIds = new Set(unlocked.map((u) => u.achievement_id));
  const arAchievements = achievements.filter((a) => a.category === "ar");

  return (
    <div className="h-full overflow-y-auto px-3 pb-4 no-scrollbar">
      <div className="surface-glass rounded-2xl border border-primary/40 p-4">
        <p className="font-display text-sm font-bold text-gradient-gold">AR discoveries</p>
        <p className="text-[11px] text-muted-foreground">
          {found.size} of {collectibles.length} collectibles found
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {collectibles.map((c) => {
            const store = stores.find((s) => s.id === c.store_id);
            return (
              <div
                key={c.id}
                className={cn(
                  "rounded-xl border p-2 text-center text-[10px]",
                  found.has(c.id) ? "border-primary/60 text-foreground" : "border-border text-muted-foreground opacity-60",
                )}
              >
                <Gem className={cn("mx-auto h-5 w-5", found.has(c.id) ? "text-primary" : "text-muted-foreground")} />
                <p className="mt-1 font-semibold">{c.name}</p>
                <p className="truncate">{store?.name ?? c.store_id}</p>
                <p className="text-primary">+{c.xp_reward} XP</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="surface-glass mt-3 rounded-2xl border border-border p-4">
        <p className="font-display text-sm font-bold text-gradient-gold">AR achievements</p>
        <ul className="mt-2 space-y-2">
          {arAchievements.map((a) => (
            <li
              key={a.id}
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl border p-2.5 text-[11px]",
                unlockedIds.has(a.id) ? "border-primary/60" : "border-border opacity-70",
              )}
            >
              <span className="min-w-0">
                <span className="block font-semibold text-foreground">{a.name}</span>
                <span className="block truncate text-muted-foreground">{a.description}</span>
              </span>
              <span className="shrink-0 font-bold text-primary">
                {unlockedIds.has(a.id) ? "Unlocked" : `+${a.xp_reward} XP`}
              </span>
            </li>
          ))}
          {arAchievements.length === 0 && (
            <li className="text-[11px] text-muted-foreground">Information unavailable</li>
          )}
        </ul>
      </div>
    </div>
  );
}