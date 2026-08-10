import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import type { StoreMapProps } from "./StoreMapImpl";

const Impl = lazy(() => import("./StoreMapImpl"));

function Placeholder({ className }: { className?: string | undefined }) {
  return (
    <div
      className={`grid place-items-center overflow-hidden rounded-2xl border border-border bg-card ${className ?? "h-64"}`}
    >
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
    </div>
  );
}

export function StoreMap(props: StoreMapProps) {
  return (
    <ClientOnly fallback={<Placeholder className={props.className} />}>
      <Suspense fallback={<Placeholder className={props.className} />}>
        <Impl {...props} />
      </Suspense>
    </ClientOnly>
  );
}
