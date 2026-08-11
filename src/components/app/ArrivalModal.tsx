import { MapPin, X } from "lucide-react";
import type { StoreLocation } from "@/hooks/useStoreGeofence";

interface Props {
  store: StoreLocation | null;
  onCheckIn: (storeId: string) => void;
  onDismiss: () => void;
}

export function ArrivalModal({ store, onCheckIn, onDismiss }: Props) {
  if (!store) return null;

  return (
    <div className="fixed inset-x-4 top-6 z-50 mx-auto max-w-lg animate-in slide-in-from-top-4 fade-in">
      <div className="flex flex-col gap-3 rounded-2xl border-2 border-primary/70 bg-card p-4 text-card-foreground shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 shrink-0 text-primary" />
            <div className="min-w-0">
              <h4 className="truncate font-bold text-primary">You're at {store.name}!</h4>
              <p className="text-xs text-muted-foreground">Ready to check in and earn +20 XP?</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss arrival notice"
            className="p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={() => {
              onCheckIn(store.id);
              onDismiss();
            }}
            className="flex-1 rounded-xl bg-linear-to-r from-primary to-warning py-2 text-xs font-bold text-primary-foreground"
          >
            Check in now (+20 XP)
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-xl border border-border px-3 text-xs text-muted-foreground"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}