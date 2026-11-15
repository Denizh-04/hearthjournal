import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { RoomScene } from "@/components/room/RoomScene";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Hearth — A cozy room for your journal" },
      { name: "description", content: "Step into a warm little room, open your journal, and write with music that follows your mood." },
      { property: "og:title", content: "Hearth — A cozy room for your journal" },
      { property: "og:description", content: "Step into a warm little room, open your journal, and write with music that follows your mood." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RoomPage,
});

function RoomPage() {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);
  const open = useCallback(() => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => navigate({ to: "/journal" }), 700);
  }, [leaving, navigate]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-foreground">
      <RoomScene onOpen={open} />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center p-6">
        <div className="rounded-full bg-card/85 px-5 py-2 text-center shadow-lg backdrop-blur animate-rise">
          <h1 className="font-display text-xl font-semibold text-card-foreground">Hearth</h1>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 p-6">
        <p className="rounded-full bg-card/80 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
          WASD / arrows to walk · drag to look around · open the journal on the table
        </p>
        <button onClick={open} className="pointer-events-auto rounded-full bg-primary px-6 py-2.5 font-semibold text-primary-foreground shadow-xl transition-transform hover:scale-105">
          Open journal
        </button>
      </div>
      <div className={cn("pointer-events-none absolute inset-0 bg-background transition-opacity duration-700", leaving ? "opacity-100" : "opacity-0")} />
    </main>
  );
}
