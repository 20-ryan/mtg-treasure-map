import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Camera, ImageUp, Loader2, Sparkles, QrCode, Receipt, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { identifyCard, parseReceipt, type ReceiptLine } from "@/lib/scan.functions";
import { useCollection, useCollectionActions, type ScannedCard } from "@/lib/collection";
import { useCatalog } from "@/lib/mtg";
import { achievementStats, useGamification, usePurchases } from "@/lib/gamification";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/scan")({
  validateSearch: (search: Record<string, unknown>): { mode?: Mode } => {
    const m = search['mode'];
    return m === "checkin" || m === "receipt" || m === "card" ? { mode: m } : {};
  },
  head: () => ({
    meta: [
      { title: "Scanner & Check-in — MTG SG Finder" },
      {
        name: "description",
        content:
          "Scan Magic cards with AI, log receipts with OCR, and check in at Singapore game stores to earn XP.",
      },
      { property: "og:title", content: "Scanner & Check-in — MTG SG Finder" },
      { property: "og:description", content: "Card scanner, receipt OCR and QR store check-in in one place." },
    ],
  }),
  component: ScanPage,
});

type Mode = "card" | "receipt" | "checkin";

const TABS: { id: Mode; label: string; icon: typeof Camera }[] = [
  { id: "card", label: "Card", icon: Camera },
  { id: "receipt", label: "Receipt", icon: Receipt },
  { id: "checkin", label: "Check-in", icon: QrCode },
];

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

function ScanPage() {
  const { mode: initialMode } = Route.useSearch();
  const [mode, setMode] = useState<Mode>(initialMode ?? "card");
  const { signedIn } = useCollectionActions();

  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode]);

  return (
    <div className="pb-10">
      <PageHeader title="Scanner" subtitle="Cards, receipts and store check-ins" />

      <div className="px-4 pt-4">
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-card p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors",
                mode === id ? "bg-linear-to-r from-primary to-warning text-primary-foreground" : "text-muted-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {!signedIn && (
        <div className="mx-4 mt-4 rounded-xl border border-primary/40 bg-card p-3 text-center text-xs text-muted-foreground">
          <Link to="/account" className="font-semibold text-primary">
            Sign in
          </Link>{" "}
          to save scans, receipts and XP.
        </div>
      )}

      {mode === "card" && <CardScanner />}
      {mode === "receipt" && <ReceiptScanner />}
      {mode === "checkin" && <CheckInScanner />}
    </div>
  );
}

/* ------------------------- card scanner ------------------------- */

function CardScanner() {
  const run = useServerFn(identifyCard);
  const { addCard, signedIn } = useCollectionActions();
  const { syncAchievements, bumpChallenge } = useGamification();
  const { data: cards = [] } = useCollection();
  const { data: purchases = [] } = usePurchases();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScannedCard | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 6_000_000) {
      toast.error("That photo is too large — try one under 6MB.");
      return;
    }
    const dataUrl = await readFile(file);
    setPreview(dataUrl);
    setResult(null);
    setBusy(true);
    try {
      const card = await run({ data: { image: dataUrl } });
      setResult(card);
      toast.success(`Identified ${card.card_name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scan failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAdd() {
    if (!result) return;
    try {
      const { duplicate, xp } = await addCard(result);
      toast.success(duplicate ? `Quantity increased · +${xp} XP` : `Added to collection · +${xp} XP`);
      await bumpChallenge("cards_scanned");
      const stats = achievementStats(
        [...cards, { ...result, id: "tmp", quantity: 1, created_at: "" }],
        purchases,
      );
      const unlocked = await syncAchievements(stats);
      for (const a of unlocked) toast.success(`Achievement unlocked: ${a.name} · +${a.xp_reward} XP`);
      setResult(null);
      setPreview(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save that card.");
    }
  }

  return (
    <div className="space-y-4 px-4 pt-4">
      <div className="relative grid h-72 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-primary/60 bg-card">
        {preview ? (
          <img src={preview} alt="Card being scanned" className="h-full w-full object-contain" />
        ) : (
          <div className="px-8 text-center">
            <Camera className="mx-auto h-14 w-14 text-primary" strokeWidth={1.5} />
            <p className="mt-3 text-xs text-muted-foreground">
              Align the card straight-on in good light, or upload a photo from your gallery.
            </p>
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-background/80 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Reading the card…
            </span>
          </div>
        )}
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => void handleFile(e.target.files?.[0])} />
      <input ref={galleryRef} type="file" accept="image/*" hidden onChange={(e) => void handleFile(e.target.files?.[0])} />

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => cameraRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-primary to-warning py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          <Camera className="h-4 w-4" /> Scan card
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => galleryRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold disabled:opacity-60"
        >
          <ImageUp className="h-4 w-4" /> Upload
        </button>
      </div>

      {result && (
        <div className="rounded-2xl border border-primary/40 bg-card p-4">
          <div className="flex gap-3">
            {result.image_url && (
              <img src={result.image_url} alt={result.card_name} className="h-32 w-24 shrink-0 rounded-lg object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-primary">
                <Sparkles className="h-3 w-3" /> Identified
              </p>
              <h2 className="mt-1 truncate text-base font-bold">{result.card_name}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {result.set_name || "Unknown set"} {result.set_code && `· ${result.set_code}`}
              </p>
              <p className="text-xs capitalize text-muted-foreground">
                {result.rarity}
                {result.collector_number ? ` · #${result.collector_number}` : ""}
              </p>
            </div>
          </div>

          {signedIn ? (
            <button
              type="button"
              onClick={() => void handleAdd()}
              className="mt-4 w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground"
            >
              Add to my collection
            </button>
          ) : (
            <Link to="/account" className="mt-4 block rounded-lg border border-primary py-2.5 text-center text-sm font-semibold text-primary">
              Sign in to save this card
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------- receipt scanner ------------------------- */

function ReceiptScanner() {
  const run = useServerFn(parseReceipt);
  const { logPurchase, syncAchievements, signedIn } = useGamification();
  const { data: cards = [] } = useCollection();
  const { data: purchases = [] } = usePurchases();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [lines, setLines] = useState<ReceiptLine[]>([]);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 6_000_000) {
      toast.error("That photo is too large — try one under 6MB.");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await readFile(file);
      const res = await run({ data: { image: dataUrl } });
      setStoreName(res.store_name);
      setLines(res.items);
      toast.success(`Found ${res.items.length} line item${res.items.length === 1 ? "" : "s"}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Receipt scan failed.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    try {
      for (const line of lines) {
        await logPurchase({ store_name: storeName, product_description: line.product_description, quantity: line.quantity, price: line.price });
      }
      const unlocked = await syncAchievements(
        achievementStats(cards, [...purchases, ...lines.map((l) => ({ product_description: l.product_description }))]),
      );
      for (const a of unlocked) toast.success(`Achievement unlocked: ${a.name} · +${a.xp_reward} XP`);
      toast.success(`Logged ${lines.length} purchase${lines.length === 1 ? "" : "s"} · +30 XP each`);
      setLines([]);
      setStoreName(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save those purchases.");
    }
  }

  return (
    <div className="space-y-4 px-4 pt-4">
      <div className="grid h-56 place-items-center rounded-2xl border-2 border-dashed border-primary/60 bg-card px-8 text-center">
        {busy ? (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading your receipt…
          </span>
        ) : (
          <div>
            <Receipt className="mx-auto h-12 w-12 text-primary" strokeWidth={1.5} />
            <p className="mt-3 text-xs text-muted-foreground">
              Photograph a store receipt to log what you bought and earn XP.
            </p>
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => void handleFile(e.target.files?.[0])} />
      <button
        type="button"
        disabled={busy}
        onClick={() => fileRef.current?.click()}
        className="w-full rounded-xl bg-linear-to-r from-primary to-warning py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
      >
        Scan receipt
      </button>

      {lines.length > 0 && (
        <div className="rounded-2xl border border-primary/40 bg-card p-4">
          <p className="text-[11px] uppercase tracking-wide text-primary">{storeName ?? "Store not detected"}</p>
          <ul className="mt-2 divide-y divide-border">
            {lines.map((l, i) => (
              <li key={`${l.product_description}-${i}`} className="flex items-center justify-between gap-3 py-2 text-xs">
                <span className="min-w-0 truncate">
                  {l.quantity}× {l.product_description}
                </span>
                <span className="shrink-0 font-semibold text-primary">
                  {l.price != null ? `S$${l.price.toFixed(2)}` : "—"}
                </span>
              </li>
            ))}
          </ul>
          {signedIn && (
            <button
              type="button"
              onClick={() => void save()}
              className="mt-3 w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-primary-foreground"
            >
              Save to purchase history
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------- QR check-in ------------------------- */

function CheckInScanner() {
  const { stores } = useCatalog();
  const { checkIn, signedIn } = useGamification();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (!scanning) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let cancelled = false;

    async function start() {
      try {
        const jsQR = (await import("jsqr")).default;
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (cancelled) return;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        const tick = () => {
          const canvas = canvasRef.current;
          if (!canvas || !video.videoWidth) {
            raf = requestAnimationFrame(tick);
            return;
          }
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(image.data, image.width, image.height);
          if (code?.data) {
            const text = code.data.toLowerCase();
            const match = stores.find((s) => text.includes(s.id) || text.includes(s.name.toLowerCase()));
            if (match) {
              setScanning(false);
              void handleCheckIn(match.id, match.name);
              return;
            }
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch {
        setScanning(false);
        toast.error("Camera unavailable — pick your store below instead.");
      }
    }
    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [scanning, stores]);

  async function handleCheckIn(storeId: string, name: string) {
    try {
      const res = await checkIn(storeId);
      setDone(name);
      toast.success(res.repeat ? `Already checked in at ${name} today.` : `Checked in at ${name} · +${res.xp} XP`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Check-in failed.");
    }
  }

  return (
    <div className="space-y-4 px-4 pt-4">
      <div className="relative grid h-64 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-primary/60 bg-card">
        <video ref={videoRef} playsInline muted className={cn("h-full w-full object-cover", !scanning && "hidden")} />
        <canvas ref={canvasRef} className="hidden" />
        {!scanning && (
          <div className="px-8 text-center">
            {done ? (
              <>
                <CheckCircle2 className="mx-auto h-12 w-12 text-success" strokeWidth={1.5} />
                <p className="mt-3 text-xs text-muted-foreground">Checked in at {done}.</p>
              </>
            ) : (
              <>
                <QrCode className="mx-auto h-12 w-12 text-primary" strokeWidth={1.5} />
                <p className="mt-3 text-xs text-muted-foreground">
                  Scan the QR code at the counter to earn +20 XP per store, once a day.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={!signedIn}
        onClick={() => setScanning((v) => !v)}
        className="w-full rounded-xl bg-linear-to-r from-primary to-warning py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
      >
        {scanning ? "Stop scanning" : "Scan store QR code"}
      </button>

      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Or select the store you're at</p>
        {stores.map((s) => (
          <button
            key={s.id}
            type="button"
            disabled={!signedIn}
            onClick={() => void handleCheckIn(s.id, s.name)}
            className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-3 text-left disabled:opacity-60"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{s.name}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{s.address}</span>
            </span>
            <span className="shrink-0 text-xs font-bold text-primary">+20 XP</span>
          </button>
        ))}
      </div>
    </div>
  );
}
