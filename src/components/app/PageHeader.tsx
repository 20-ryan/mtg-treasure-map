import { Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  action?: ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-xl">
      {back ? (
        <button
          type="button"
          onClick={() => router.history.back()}
          aria-label="Go back"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      ) : (
        <Link to="/" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-linear-to-br from-accent to-arcane font-display text-sm font-bold text-accent-foreground">
          M
        </Link>
      )}
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold">{title}</h1>
        {subtitle && <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="shrink-0">{action}</div>
    </header>
  );
}
