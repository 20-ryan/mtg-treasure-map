import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { LogOut, Mail } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account — MTG SG Finder" },
      { name: "description", content: "Sign in to sync your wishlist and restock alerts across devices." },
      { property: "og:title", content: "Account — MTG SG Finder" },
      { property: "og:description", content: "Your MTG SG Finder account." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (res.error) toast.error(res.error.message);
    else if (mode === "signup" && !res.data.session) toast.success("Check your email to confirm your account.");
    else toast.success("Signed in.");
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error("Google sign-in failed.");
  }

  if (user) {
    return (
      <div className="pb-10">
        <PageHeader title="Account" subtitle={user.email ?? "Signed in"} />
        <div className="space-y-3 px-4 pt-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-semibold">{user.email}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Your wishlist and restock alerts sync to this account.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-3 text-sm font-semibold"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <PageHeader title="Account" subtitle="Sync your wishlist and alerts" />
      <div className="space-y-4 px-4 pt-4">
        <button
          type="button"
          onClick={() => void handleGoogle()}
          className="w-full rounded-lg bg-linear-to-r from-primary to-warning py-3 text-sm font-bold text-primary-foreground"
        >
          Continue with Google
        </button>

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or email <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleEmail} className="space-y-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm outline-none"
          />
          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary py-2.5 text-sm font-semibold text-primary disabled:opacity-60"
          >
            <Mail className="h-4 w-4" /> {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full text-center text-xs text-muted-foreground"
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
