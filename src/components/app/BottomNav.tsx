import { Link } from "@tanstack/react-router";
import { Home, Search, Map, Camera, Layers, User } from "lucide-react";
import { useWishlist } from "@/lib/wishlist";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/map", label: "Stores", icon: Map },
  { to: "/scan", label: "Scan", icon: Camera },
  { to: "/collection", label: "Cards", icon: Layers },
  { to: "/account", label: "Account", icon: User },
] as const;

export function BottomNav() {
  const { items: wished } = useWishlist();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-lg border-t border-border bg-popover/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      <ul className="grid grid-cols-6">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="group relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground transition-colors data-[status=active]:text-primary"
            >
              <span className="relative">
                <Icon className="h-5 w-5" strokeWidth={1.9} />
                {to === "/collection" && wished.length > 0 && (
                  <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-foreground">
                    {wished.length}
                  </span>
                )}
              </span>
              {label}
              <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-primary opacity-0 transition-opacity group-data-[status=active]:opacity-100" />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
