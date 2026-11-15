import { useSyncExternalStore } from "react";
import type { Mood } from "./moods";

export interface Entry {
  id: string;
  title: string;
  body: string;
  mood: Mood | null;
  createdAt: number;
  updatedAt: number;
}

const KEY = "hearth.entries";
const listeners = new Set<() => void>();
let cache: Entry[] | null = null;
const EMPTY: Entry[] = [];

function read(): Entry[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    cache = [];
  }
  return cache!;
}
function write(next: Entry[]) {
  cache = next;
  localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export function useEntries(): Entry[] {
  return useSyncExternalStore(
    (cb) => (listeners.add(cb), () => listeners.delete(cb)),
    read,
    () => EMPTY,
  );
}

export function saveEntry(entry: Omit<Entry, "createdAt" | "updatedAt"> & { createdAt?: number }) {
  const all = read();
  const now = Date.now();
  const existing = all.find((e) => e.id === entry.id);
  const saved: Entry = { ...entry, createdAt: existing?.createdAt ?? entry.createdAt ?? now, updatedAt: now };
  write(existing ? all.map((e) => (e.id === entry.id ? saved : e)) : [saved, ...all]);
  return saved;
}

export function deleteEntry(id: string) {
  write(read().filter((e) => e.id !== id));
}

const dayKey = (t: number) => new Date(t).toDateString();

/** Consecutive days with at least one entry, ending today (or yesterday if nothing yet today). */
export function computeStreak(entries: Entry[], now = Date.now()): number {
  const days = new Set(entries.map((e) => dayKey(e.createdAt)));
  const d = new Date(now);
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  let streak = 0;
  while (days.has(d.toDateString())) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
