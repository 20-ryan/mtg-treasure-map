import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Camera, ImageUp, Loader2, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { identifyCard } from "@/lib/scan.functions";
import { useCollectionActions, type ScannedCard } from "@/lib/collection";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "AI Card Scanner — MTG SG Finder" },
      {
        name: "description",
        content: "Scan or upload a Magic card photo to identify its set, rarity and collector number, then add it to your collection.",
      },
      { property: "og:title", content: "AI Card Scanner — MTG SG Finder" },
      { property: "og:description", content: "Identify any Magic card from a photo and log it to your collection." },
    ],
  }),
  component: ScanPage,
});

function ScanPage() {
  const run = useServerFn(identifyCard);
  const { addCard, signedIn } = useCollectionActions();
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
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Could not read that file."));
      reader.readAsDataURL(file);
    });
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
      setResult(null);
      setPreview(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save that card.");
    }
  }

  return (
    <div className="pb-10">
      <PageHeader title="AI Card Scanner" subtitle="Identify a card and log it instantly" />

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

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />

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
                <img
                  src={result.image_url}
                  alt={result.card_name}
                  className="h-32 w-24 shrink-0 rounded-lg object-cover"
                />
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
              <Link
                to="/account"
                className="mt-4 block rounded-lg border border-primary py-2.5 text-center text-sm font-semibold text-primary"
              >
                Sign in to save this card
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
