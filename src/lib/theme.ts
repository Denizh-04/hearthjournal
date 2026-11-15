import { useEffect, useState } from "react";

export const THEMES = [
  { id: "cozy", label: "Cozy", colors: ["#f6efe3", "#c9724a", "#bcd6ad"] },
  { id: "midnight", label: "Midnight", colors: ["#1b1e2b", "#e7b766", "#3d7c86"] },
  { id: "sage", label: "Sage", colors: ["#eef3ea", "#4f7d5e", "#e6d79a"] },
  { id: "ocean", label: "Ocean", colors: ["#ecf3f8", "#2f6b9a", "#9fd6d2"] },
  { id: "blossom", label: "Blossom", colors: ["#fbefef", "#c75a6f", "#dcc4e6"] },
  { id: "paper", label: "Paper (high contrast)", colors: ["#fafafa", "#1a1a1a", "#f0d955"] },
] as const;
export type ThemeId = (typeof THEMES)[number]["id"];

const KEY = "hearth.theme";
export function applyStoredTheme() {
  document.documentElement.dataset["theme"] = localStorage.getItem(KEY) ?? "cozy";
}
export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>("cozy");
  useEffect(() => setThemeState((localStorage.getItem(KEY) as ThemeId) ?? "cozy"), []);
  const setTheme = (t: ThemeId) => {
    localStorage.setItem(KEY, t);
    document.documentElement.dataset["theme"] = t;
    setThemeState(t);
  };
  return { theme, setTheme };
}
