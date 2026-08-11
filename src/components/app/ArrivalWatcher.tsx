import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrivalModal } from "./ArrivalModal";
import { useStoreGeofence } from "@/hooks/useStoreGeofence";
import { useGamification } from "@/lib/gamification";

/** Watches the player's location and offers a one-tap check-in on arrival. */
export function ArrivalWatcher() {
  const { arrivedStore, dismissArrival } = useStoreGeofence(100);
  const { checkIn, signedIn } = useGamification();
  const navigate = useNavigate();

  function handleCheckIn(_storeId: string) {
    if (!signedIn) {
      toast.info("Sign in to check in and earn XP.");
      void navigate({ to: "/account" });
      return;
    }
    void navigate({ to: "/scan", search: { mode: "checkin" } });
  }

  return <ArrivalModal store={arrivedStore} onCheckIn={handleCheckIn} onDismiss={dismissArrival} />;
}