import { Link } from "@tanstack/react-router";
import { BookHeart, DoorOpen, Settings, UserRound } from "lucide-react";

export function AppNav() {
  return (
    <nav className="flex items-center justify-between rounded-full bg-panel px-5 py-2.5 animate-rise">
      <Link to="/journal" className="flex items-center gap-2 font-display text-lg font-semibold">
        <BookHeart className="h-5 w-5 text-primary" /> Hearth
      </Link>
      <div className="flex items-center gap-1 text-sm">
        <Link to="/" className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-muted-foreground hover:bg-card hover:text-foreground">
          <DoorOpen className="h-4 w-4" /> <span className="hidden sm:inline">Room</span>
        </Link>
        <Link to="/settings" activeProps={{ className: "bg-card text-foreground" }} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-muted-foreground hover:bg-card hover:text-foreground">
          <Settings className="h-4 w-4" /> <span className="hidden sm:inline">Settings</span>
        </Link>
        <span className="ml-1 grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground" aria-label="Account">
          <UserRound className="h-4 w-4" />
        </span>
      </div>
    </nav>
  );
}
