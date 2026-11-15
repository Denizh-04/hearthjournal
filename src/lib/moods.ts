export type Mood = "calm" | "uplifting" | "comforting" | "energetic";
export type Instrument = "piano" | "bass" | "drums" | "violin";

export const MOODS: { id: Mood; label: string; hint: string }[] = [
  { id: "calm", label: "Calm", hint: "Soft and reassuring" },
  { id: "uplifting", label: "Uplifting", hint: "Bright and proud" },
  { id: "comforting", label: "Comforting", hint: "Gentle and warm" },
  { id: "energetic", label: "Energetic", hint: "Driven and motivated" },
];

// Journal signal -> supportive music response.
const SIGNALS: Record<Mood, string[]> = {
  calm: ["stress", "stressed", "anxious", "anxiety", "overwhelmed", "worried", "worry", "panic", "nervous", "tense", "busy", "pressure", "angry", "frustrated", "exhausted", "tired"],
  uplifting: ["proud", "success", "achieved", "achievement", "win", "won", "happy", "grateful", "thankful", "joy", "excited", "great", "amazing", "love", "celebrate", "accomplished"],
  comforting: ["sad", "lonely", "alone", "cry", "cried", "hurt", "miss", "lost", "grief", "down", "empty", "heartbroken", "rejected", "upset", "depressed"],
  energetic: ["goal", "goals", "motivated", "motivation", "ambition", "plan", "start", "gym", "workout", "focus", "productive", "build", "dream", "determined", "ready"],
};

export interface MoodAnalysis {
  mood: Mood;
  matches: string[];
}

/** Local keyword analysis: picks the mood whose signal words appear most. Defaults to calm. */
export function analyzeMood(text: string): MoodAnalysis {
  const words = text.toLowerCase().match(/[a-z']+/g) ?? [];
  let best: MoodAnalysis = { mood: "calm", matches: [] };
  for (const mood of Object.keys(SIGNALS) as Mood[]) {
    const matches = words.filter((w) => SIGNALS[mood].includes(w));
    if (matches.length > best.matches.length) best = { mood, matches };
  }
  return { mood: best.mood, matches: Array.from(new Set(best.matches)) };
}
