import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { AppNav } from "@/components/journal/AppNav";
import { THEMES, useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Hearth" },
      { name: "description", content: "Choose a colour theme and manage your Hearth journal preferences." },
      { property: "og:title", content: "Settings — Hearth" },
      { property: "og:description", content: "Choose a colour theme and manage your Hearth journal preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 p-4 sm:p-6 animate-page-open">
      <AppNav />
      <section className="rounded-3xl bg-panel p-6 animate-rise">
        <h1 className="font-display text-3xl font-semibold">Settings</h1>
        <h2 className="mt-6 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Colour theme</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {THEMES.map((t) => (
            <button key={t.id} onClick={() => setTheme(t.id)}
              className={cn("flex items-center justify-between rounded-2xl border-2 bg-card p-4 text-left transition-all hover:-translate-y-0.5",
                theme === t.id ? "border-primary" : "border-transparent")}>
              <div>
                <div className="flex gap-1">
                  {t.colors.map((c) => <span key={c} className="h-6 w-6 rounded-full border border-border" style={{ background: c }} />)}
                </div>
                <p className="mt-2 font-semibold">{t.label}</p>
              </div>
              {theme === t.id && <Check className="h-5 w-5 text-primary" />}
            </button>
          ))}
        </div>
        <h2 className="mt-8 text-sm font-semibold uppercase tracking-widest text-muted-foreground">Privacy</h2>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Your entries are stored only on this device. The AI music button reads your words right here in the browser — nothing is sent anywhere.
        </p>
      </section>
    </div>
  );
}
