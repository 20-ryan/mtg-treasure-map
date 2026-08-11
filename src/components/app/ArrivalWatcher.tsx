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

  async function handleCheckIn(storeId: string) {
    if (!signedIn) {
      toast.info("Sign in to check in and earn XP.");
      void navigate({ to: "/account" });
      return;
    }
    try {
      const res = await checkIn(storeId);
      toast.success(res.repeat ? "You already checked in here today." : `Checked in · +${res.xp} XP`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Check-in failed.");
      void navigate({ to: "/scan" });
    }
  }

  return <ArrivalModal store={arrivedStore} onCheckIn={(id) => void handleCheckIn(id)} onDismiss={dismissArrival} />;
}