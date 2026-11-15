import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownUp, Flame, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { AppNav } from "@/components/journal/AppNav";
import { computeStreak, deleteEntry, useEntries } from "@/lib/entries";
import { MOODS, type Mood } from "@/lib/moods";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/journal/")({
  head: () => ({
    meta: [
      { title: "Your journal — Hearth" },
      { name: "description", content: "Affirmations, prompts, your writing streak and every journal entry in one calm place." },
      { property: "og:title", content: "Your journal — Hearth" },
      { property: "og:description", content: "Affirmations, prompts, your writing streak and every journal entry in one calm place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const AFFIRMATIONS = [
  "You are allowed to take up space today.",
  "Small steps still move you forward.",
  "Your feelings are valid, and they will pass.",
  "You've made it through every hard day so far.",
  "Rest is productive too.",
];
const PROMPTS = [
  "What made you smile today?",
  "Something you're quietly proud of…",
  "What's weighing on you, and what could lighten it?",
  "Describe your ideal tomorrow.",
  "Who would you like to thank, and why?",
];

function Dashboard() {
  const entries = useEntries();
  const [q, setQ] = useState("");
  const [mood, setMood] = useState<Mood | "all">("all");
  const [newest, setNewest] = useState(true);
  const day = new Date().getDate();
  const streak = computeStreak(entries);

  const week = useMemo(() => Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return { label: d.toLocaleDateString(undefined, { weekday: "narrow" }), done: entries.some((e) => new Date(e.createdAt).toDateString() === d.toDateString()) };
  }), [entries]);

  const shown = useMemo(() => entries
    .filter((e) => mood === "all" || e.mood === mood)
    .filter((e) => (e.title + " " + e.body).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (newest ? b.createdAt - a.createdAt : a.createdAt - b.createdAt)), [entries, q, mood, newest]);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 p-4 sm:p-6 animate-page-open">
      <AppNav />
      <section className="grid gap-4 md:grid-cols-[1.6fr_1fr]">
        <div className="rounded-3xl bg-panel p-6 animate-rise">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Today's affirmation</p>
          <h2 className="mt-2 font-display text-2xl leading-snug sm:text-3xl">{AFFIRMATIONS[day % AFFIRMATIONS.length]}</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {[0, 1, 2].map((i) => {
              const p = PROMPTS[(day + i) % PROMPTS.length];
              return (
                <Link key={p} to="/journal/$id" params={{ id: "new" }} search={{ prompt: p }}
                  className="rounded-full bg-card px-3 py-1.5 text-sm text-card-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
                  {p}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-3xl bg-panel p-6 animate-rise [animation-delay:100ms]">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-highlight text-highlight-foreground"><Flame className="h-6 w-6" /></span>
            <div>
              <p className="font-display text-3xl font-semibold">{streak} day{streak === 1 ? "" : "s"}</p>
              <p className="text-sm text-muted-foreground">journaling streak</p>
            </div>
          </div>
          <div className="mt-5 flex justify-between gap-1">
            {week.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className={cn("h-8 w-8 rounded-full transition-colors", d.done ? "bg-primary" : "bg-card")} />
                <span className="text-xs text-muted-foreground">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-2 rounded-2xl bg-panel p-2 animate-rise [animation-delay:150ms]">
        <label className="flex flex-1 items-center gap-2 rounded-xl bg-card px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search entries" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </label>
        <select value={mood} onChange={(e) => setMood(e.target.value as Mood | "all")} className="rounded-xl bg-card px-3 py-2 text-sm outline-none">
          <option value="all">All moods</option>
          {MOODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
        <button onClick={() => setNewest(!newest)} className="flex items-center gap-1.5 rounded-xl bg-card px-3 py-2 text-sm">
          <ArrowDownUp className="h-4 w-4" /> {newest ? "Newest" : "Oldest"}
        </button>
        <Link to="/journal/$id" params={{ id: "new" }} search={{ prompt: undefined }} className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          <Plus className="h-4 w-4" /> Add entry
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {shown.map((e, i) => (
          <Link key={e.id} to="/journal/$id" params={{ id: e.id }} search={{ prompt: undefined }}
            className="group relative flex aspect-[4/5] flex-col rounded-3xl bg-panel p-4 transition-all hover:-translate-y-1 hover:shadow-lg animate-rise"
            style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}>
            <p className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
            <h3 className="mt-1 line-clamp-2 font-display text-lg font-semibold leading-tight">{e.title || "Untitled"}</h3>
            <p className="mt-2 line-clamp-5 flex-1 text-sm text-muted-foreground">{e.body}</p>
            {e.mood && <span className="self-start rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground">{MOODS.find((m) => m.id === e.mood)?.label}</span>}
            <button onClick={(ev) => { ev.preventDefault(); if (confirm("Delete this entry?")) deleteEntry(e.id); }}
              className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100" aria-label="Delete entry">
              <Trash2 className="h-4 w-4" />
            </button>
          </Link>
        ))}
        {shown.length === 0 && (
          <Link to="/journal/$id" params={{ id: "new" }} search={{ prompt: undefined }} className="col-span-full grid place-items-center rounded-3xl border-2 border-dashed border-border p-12 text-center text-muted-foreground hover:text-foreground">
            {entries.length ? "No entries match." : "Your journal is empty. Write your first entry →"}
          </Link>
        )}
      </section>
    </div>
  );
}
