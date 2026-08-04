import { STORES, type Store } from "@/lib/mtg";
import { cn } from "@/lib/utils";

const LAT = { min: 1.268, max: 1.308 };
const LNG = { min: 103.828, max: 103.865 };

const project = (lat: number, lng: number) => ({
  x: ((lng - LNG.min) / (LNG.max - LNG.min)) * 100,
  y: (1 - (lat - LAT.min) / (LAT.max - LAT.min)) * 100,
});

export function StoreMap({
  activeId,
  onSelect,
  user,
  className,
}: {
  activeId?: string | null;
  onSelect?: (store: Store) => void;
  user: { lat: number; lng: number };
  className?: string;
}) {
  const me = project(user.lat, user.lng);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-popover",
        className,
      )}
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.62 0.17 262 / 0.22) 1px, transparent 1px), linear-gradient(90deg, oklch(0.62 0.17 262 / 0.22) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path d="M0 62 L28 55 L54 68 L78 48 L100 58" fill="none" stroke="oklch(0.78 0.14 84 / 0.25)" strokeWidth="1.2" />
        <path d="M18 0 L26 40 L14 72 L22 100" fill="none" stroke="oklch(0.78 0.14 84 / 0.18)" strokeWidth="1" />
        <path d="M64 0 L58 34 L72 66 L66 100" fill="none" stroke="oklch(0.78 0.14 84 / 0.18)" strokeWidth="1" />
        <circle cx="82" cy="22" r="14" fill="oklch(0.55 0.18 295 / 0.16)" />
        <circle cx="20" cy="86" r="12" fill="oklch(0.62 0.17 262 / 0.16)" />
      </svg>

      <div
        className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${me.x}%`, top: `${me.y}%` }}
      >
        <span className="absolute inset-0 -m-3 animate-ping rounded-full bg-arcane/40" />
        <span className="relative block h-3.5 w-3.5 rounded-full border-2 border-background bg-arcane" />
      </div>

      {STORES.map((store) => {
        const p = project(store.lat, store.lng);
        const active = activeId === store.id;
        return (
          <button
            key={store.id}
            type="button"
            onClick={() => onSelect?.(store)}
            className="absolute z-20 -translate-x-1/2 -translate-y-full"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            aria-label={store.name}
          >
            <span
              className={cn(
                "grid h-8 w-8 place-items-center rounded-full border-2 text-[10px] font-bold shadow-lg transition-all",
                active
                  ? "scale-115 border-primary bg-primary text-primary-foreground mythic-ring"
                  : "border-primary/50 bg-card text-primary",
              )}
            >
              {store.name.replace(/^The /, "").charAt(0)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
