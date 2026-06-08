// Core gamification logic for Discipline OS

export type Priority = "A" | "B" | "C" | "D";

export const PRIORITY_POINTS: Record<Priority, number> = {
  A: 10,
  B: 7,
  C: 5,
  D: 2,
};

export const STREAK_BONUS = 5;
export const PERFECT_DAY_BONUS = 10;

export interface Rank {
  level: number;
  name: string;
  min: number;
  max: number;
  color: string; // css var token name
}

export const RANKS: Rank[] = [
  { level: 1, name: "Rookie", min: 0, max: 100, color: "muted-foreground" },
  { level: 2, name: "Beginner", min: 100, max: 300, color: "foreground" },
  { level: 3, name: "Focused Student", min: 300, max: 600, color: "accent" },
  { level: 4, name: "Consistent Learner", min: 600, max: 1000, color: "accent" },
  { level: 5, name: "Disciplined Mind", min: 1000, max: 1600, color: "warning" },
  { level: 6, name: "Productivity Warrior", min: 1600, max: 2400, color: "warning" },
  { level: 7, name: "Elite Executor", min: 2400, max: 3400, color: "primary" },
  { level: 8, name: "Master of Discipline", min: 3400, max: 5000, color: "primary" },
  { level: 9, name: "Legendary Builder", min: 5000, max: 8000, color: "primary" },
  { level: 10, name: "GOD MODE", min: 8000, max: Infinity, color: "primary" },
];

export function getRank(points: number): Rank {
  return RANKS.find((r) => points >= r.min && points < r.max) ?? RANKS[RANKS.length - 1];
}

export function getNextRank(points: number): Rank | null {
  const current = getRank(points);
  return RANKS.find((r) => r.level === current.level + 1) ?? null;
}

export function rankProgress(points: number): number {
  const r = getRank(points);
  if (r.max === Infinity) return 100;
  return Math.min(100, Math.round(((points - r.min) / (r.max - r.min)) * 100));
}

export type ProductivityLevel = "low" | "medium" | "high" | "max";

export function productivityLevel(score: number): ProductivityLevel {
  if (score >= 80) return "max";
  if (score >= 51) return "high";
  if (score >= 21) return "medium";
  return "low";
}

// Heatmap intensity bucket from a day's score: 0..4
export function heatLevel(score: number): number {
  if (score <= 0) return 0;
  if (score <= 20) return 1;
  if (score <= 50) return 2;
  if (score <= 80) return 3;
  return 4;
}

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
