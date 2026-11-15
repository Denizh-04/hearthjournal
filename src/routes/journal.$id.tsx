import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppNav } from "@/components/journal/AppNav";
import { MusicPanel } from "@/components/journal/MusicPanel";
import { saveEntry, useEntries } from "@/lib/entries";
import { useMusic } from "@/lib/music";

export const Route = createFileRoute("/journal/$id")({
  validateSearch: (s: Record<string, unknown>): { prompt: string | undefined } => ({
    prompt: typeof s["prompt"] === "string" ? s["prompt"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Write — Hearth" },
      { name: "description", content: "Write or edit a journal entry while music adapts to how you feel." },
      { property: "og:title", content: "Write — Hearth" },
      { property: "og:description", content: "Write or edit a journal entry while music adapts to how you feel." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Editor,
});

function Editor() {
  const { id } = Route.useParams();
  const { prompt } = Route.useSearch();
  const navigate = useNavigate();
  const entries = useEntries();
  const music = useMusic();
  const existing = entries.find((e) => e.id === id);
  const [entryId] = useState(() => (id === "new" ? crypto.randomUUID() : id));
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    if (existing) { setTitle(existing.title); setBody(existing.body); setLoaded(true); }
    else if (id === "new") { setTitle(prompt ?? ""); setLoaded(true); }
  }, [existing, id, prompt, loaded]);

  const save = () => {
    if (!title.trim() && !body.trim()) { toast("Write something first"); return; }
    saveEntry({ id: entryId, title: title.trim(), body, mood: music.mood });
    toast.success("Saved to your journal");
    navigate({ to: "/journal" });
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 p-4 sm:p-6 animate-page-open">
      <AppNav />
      <div className="grid flex-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <section className="flex flex-col rounded-3xl bg-panel p-5 sm:p-7 animate-rise">
          <div className="mb-4 flex items-center justify-between">
            <Link to="/journal" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Entries</Link>
            <span className="text-xs text-muted-foreground">{new Date(existing?.createdAt ?? Date.now()).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</span>
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give today a title…"
            className="bg-transparent font-display text-3xl font-semibold outline-none placeholder:text-muted-foreground/60" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Start writing. Tap AI anytime and the music will meet you where you are."
            className="paper-lines mt-4 min-h-[50vh] flex-1 resize-none bg-transparent outline-none placeholder:text-muted-foreground/60" />
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{body.trim().split(/\s+/).filter(Boolean).length} words</span>
            <button onClick={save} className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground shadow-md transition-transform hover:scale-105">
              <Check className="h-4 w-4" /> Save entry
            </button>
          </div>
        </section>
        <MusicPanel text={`${title} ${body}`} />
      </div>
    </div>
  );
}
