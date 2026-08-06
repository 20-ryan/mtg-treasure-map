import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Layers, Search, Trash2, Trophy, Zap } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import {
  ACHIEVEMENTS,
  collectionStats,
  levelFromXp,
  useCollection,
  useCollectionActions,
  useProfile,
} from "@/lib/collection";

export const Route = createFileRoute("/collection")({
  head: () => ({
    meta: [
      { title: "My Collection — MTG SG Finder" },
      {
        name: "description",
        content: "Track every Magic card you own: totals, duplicates, sets, rarities, completion and achievements.",
      },
      { property: "og:title", content: "My Collection — MTG SG Finder" },
      { property: "og:description", content: "Your scanned Magic: The Gathering card collection at a glance." },
    ],
  }),
  component: CollectionPage,
});

function CollectionPage() {
  const { data: cards = [], isLoading } = useCollection();
  const { data: profile } = useProfile();
  const { removeCard, signedIn } = useCollectionActions();
  const [query, setQuery] = useState("");
  const [rarity, setRarity] = useState("all");

  const stats = useMemo(() => collectionStats(cards), [cards]);
  const progress = levelFromXp(profile?.xp ?? 0);

  const filtered = cards.filter(
    (c) =>
      (rarity === "all" || c.rarity.toLowerCase() === rarity) &&
      (c.card_name.toLowerCase().includes(query.toLowerCase()) ||
        c.set_name.toLowerCase().includes(query.toLowerCase())),
  );

  if (!signedIn) {
    return (
      <div className="pb-10">
        <PageHeader title="My Collection" subtitle="Sign in to start collecting" />
        <div className="px-4 pt-10 text-center">
          <Layers className="mx-auto h-12 w-12 text-primary" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-muted-foreground">
            Your scanned cards, XP and achievements sync to your account.
          </p>
          <Link
            to="/account"
            className="mt-5 inline-block rounded-lg bg-linear-to-r from-primary to-warning px-6 py-2.5 text-sm font-bold text-primary-foreground"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <PageHeader title="My Collection" subtitle={`Level ${progress.level} · ${profile?.xp ?? 0} XP`} />

      <div className="space-y-4 px-4 pt-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <Zap className="h-3.5 w-3.5 text-warning" /> Level {progress.level}
            </span>
            <span>
              {progress.into} / {progress.need} XP
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-linear-to-r from-primary to-warning"
              style={{ width: `${Math.round((progress.into / progress.need) * 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Total", value: stats.total },
            { label: "Unique", value: stats.unique },
            { label: "Dupes", value: stats.duplicates },
            { label: "Complete", value: `${stats.completion}%` },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card px-2 py-3 text-center">
              <div className="text-lg font-bold">{s.value}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="flex items-center gap-1.5 text-sm font-bold">
            <Trophy className="h-4 w-4 text-warning" /> Achievements
          </h2>
          <ul className="mt-3 space-y-2">
            {ACHIEVEMENTS.map((a) => {
              const unlocked = stats.total >= a.at;
              return (
                <li key={a.id} className="flex items-center justify-between text-xs">
                  <span className={unlocked ? "font-semibold text-primary" : "text-muted-foreground"}>{a.label}</span>
                  <span className="text-[11px] text-muted-foreground">{unlocked ? "Unlocked" : a.hint}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {stats.bySet.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">By set</h3>
              <ul className="mt-2 space-y-1 text-xs">
                {stats.bySet.slice(0, 5).map(([name, n]) => (
                  <li key={name} className="flex justify-between gap-2">
                    <span className="truncate">{name}</span>
                    <span className="font-semibold">{n}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">By rarity</h3>
              <ul className="mt-2 space-y-1 text-xs">
                {stats.byRarity.map(([name, n]) => (
                  <li key={name} className="flex justify-between gap-2">
                    <span className="capitalize">{name}</span>
                    <span className="font-semibold">{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your cards"
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {["all", "mythic", "rare", "uncommon", "common"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRarity(r)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                rarity === r ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="py-8 text-center text-xs text-muted-foreground">Loading your collection…</p>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No cards yet.</p>
            <Link to="/scan" className="mt-3 inline-block text-sm font-semibold text-primary">
              Scan your first card →
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((c) => (
              <li key={c.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                {c.image_url ? (
                  <img src={c.image_url} alt={c.card_name} className="h-16 w-12 rounded-md object-cover" />
                ) : (
                  <div className="grid h-16 w-12 place-items-center rounded-md border border-border text-xs">MTG</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{c.card_name}</p>
                  <p className="truncate text-[11px] capitalize text-muted-foreground">
                    {c.set_name || c.set_code} · {c.rarity}
                    {c.collector_number ? ` · #${c.collector_number}` : ""}
                  </p>
                </div>
                <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">
                  x{c.quantity}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${c.card_name}`}
                  onClick={() => {
                    void removeCard(c.id).catch(() => toast.error("Could not remove that card."));
                  }}
                  className="text-muted-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
