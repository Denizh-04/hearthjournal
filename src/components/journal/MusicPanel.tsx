import { Drum, Guitar, Music2, Pause, Piano, Play, Sparkles, Volume2 } from "lucide-react";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { MOODS, analyzeMood, type Instrument } from "@/lib/moods";
import { music, useMusic } from "@/lib/music";
import { cn } from "@/lib/utils";

const INSTRUMENTS: { id: Instrument; label: string; Icon: typeof Drum; pos: string }[] = [
  { id: "bass", label: "Bass", Icon: Guitar, pos: "top-2 left-1/2 -translate-x-1/2" },
  { id: "violin", label: "Violin", Icon: Music2, pos: "left-2 top-1/2 -translate-y-1/2" },
  { id: "drums", label: "Drums", Icon: Drum, pos: "right-2 top-1/2 -translate-y-1/2" },
  { id: "piano", label: "Piano", Icon: Piano, pos: "bottom-2 left-1/2 -translate-x-1/2" },
];

export function MusicPanel({ text }: { text: string }) {
  const m = useMusic();
  const [ai, setAi] = useState<{ matches: string[] } | null>(null);

  const runAi = () => {
    const r = analyzeMood(text);
    music.setMood(r.mood);
    setAi({ matches: r.matches });
    music.play();
  };

  return (
    <aside className="flex flex-col gap-4 rounded-3xl bg-panel p-5 animate-rise">
      <div className="grid grid-cols-[1.3fr_1fr] gap-3">
        <div className="relative aspect-square rounded-2xl bg-accent/60">
          <span className="absolute inset-0 grid place-items-center text-xs font-semibold uppercase tracking-widest text-accent-foreground/70">Beat type</span>
          {INSTRUMENTS.map(({ id, label, Icon, pos }) => {
            const on = m.instruments.includes(id);
            return (
              <button key={id} onClick={() => music.toggleInstrument(id)} aria-pressed={on}
                className={cn("absolute flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[11px] font-semibold transition-all", pos,
                  on ? "bg-primary text-primary-foreground shadow-md" : "text-accent-foreground hover:bg-card/60")}>
                <Icon className="h-4 w-4" />{label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-1.5 rounded-2xl bg-accent/60 p-2">
          <span className="px-1 text-center text-xs font-semibold uppercase tracking-widest text-accent-foreground/70">Mood</span>
          {MOODS.map((mood) => (
            <button key={mood.id} onClick={() => { music.setMood(mood.id); setAi(null); }} title={mood.hint}
              className={cn("flex-1 rounded-lg text-sm font-semibold transition-all",
                m.mood === mood.id ? "bg-card text-foreground shadow-sm" : "text-accent-foreground hover:bg-card/50")}>
              {mood.label}
            </button>
          ))}
        </div>
      </div>

      <div className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">Music control</div>
      <div className="flex items-center justify-center gap-3">
        <button onClick={() => (m.playing ? music.stop() : music.play())}
          className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
          aria-label={m.playing ? "Pause music" : "Play music"}>
          {m.playing ? <Pause className="h-6 w-6" /> : <Play className="ml-0.5 h-6 w-6" />}
        </button>
        <button onClick={runAi}
          className="flex h-14 items-center gap-2 rounded-full bg-highlight px-5 font-semibold text-highlight-foreground shadow-md transition-transform hover:scale-105">
          <Sparkles className="h-5 w-5" /> AI
        </button>
        <div className="flex h-8 items-end gap-1" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={cn("w-1.5 rounded-full bg-primary", m.playing ? "animate-eq h-full" : "h-2")} style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 px-1">
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <Slider value={[m.volume * 100]} onValueChange={([v]) => music.setVolume((v ?? 0) / 100)} max={100} step={1} />
      </div>
      {ai && (
        <p className="rounded-2xl bg-card p-3 text-sm text-muted-foreground animate-rise">
          {ai.matches.length
            ? <>Heard <b className="text-foreground">{ai.matches.join(", ")}</b> — playing something <b className="text-foreground">{MOODS.find((x) => x.id === m.mood)?.hint.toLowerCase()}</b>.</>
            : <>No strong feelings detected yet, so here's something calm. Keep writing and tap AI again.</>}
        </p>
      )}
    </aside>
  );
}
