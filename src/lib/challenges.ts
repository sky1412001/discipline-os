import { supabase } from "@/integrations/supabase/client";
import { todayKey } from "./game";

export type ChallengeType = "weekly" | "monthly" | "yearly";
export type ChallengeCategory = "study" | "exercise" | "custom";
export type ChallengeStatus = "active" | "completed" | "failed";

export interface Challenge {
  id: string;
  user_id: string;
  title: string;
  category: ChallengeCategory;
  challenge_type: ChallengeType;
  total_days: number;
  days_completed: number;
  start_date: string;
  last_check_date: string | null;
  status: ChallengeStatus;
  created_at: string;
  updated_at: string;
}

export const TYPE_DAYS: Record<ChallengeType, number> = {
  weekly: 7,
  monthly: 30,
  yearly: 365,
};

export const TYPE_LABEL: Record<ChallengeType, string> = {
  weekly: "7-Day Challenge",
  monthly: "Monthly Challenge",
  yearly: "Yearly Challenge",
};

export const CATEGORY_LABEL: Record<ChallengeCategory, string> = {
  study: "📚 Study",
  exercise: "🏋️ Exercise",
  custom: "⚡ Custom",
};

// Suggested daily challenges users can start with one tap
export const SUGGESTED: { title: string; category: ChallengeCategory }[] = [
  { title: "Study 2 hours every day", category: "study" },
  { title: "Read 20 pages daily", category: "study" },
  { title: "Revise notes for 1 hour", category: "study" },
  { title: "Workout for 30 minutes", category: "exercise" },
  { title: "100 push-ups a day", category: "exercise" },
  { title: "10,000 steps daily", category: "exercise" },
];

export async function loadChallenges(userId: string): Promise<Challenge[]> {
  const { data } = await supabase
    .from("challenges")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data as Challenge[]) ?? [];
}

export async function createChallenge(
  userId: string,
  title: string,
  category: ChallengeCategory,
  type: ChallengeType,
) {
  const { error } = await supabase.from("challenges").insert({
    user_id: userId,
    title,
    category,
    challenge_type: type,
    total_days: TYPE_DAYS[type],
    days_completed: 0,
    status: "active",
  });
  if (error) throw error;
}

// Mark today done for a challenge (once per day)
export async function checkInChallenge(ch: Challenge) {
  const today = todayKey();
  if (ch.last_check_date === today) return;
  const days = ch.days_completed + 1;
  const done = days >= ch.total_days;
  const { error } = await supabase
    .from("challenges")
    .update({
      days_completed: days,
      last_check_date: today,
      status: done ? "completed" : "active",
    })
    .eq("id", ch.id);
  if (error) throw error;
}

export async function deleteChallenge(id: string) {
  const { error } = await supabase.from("challenges").delete().eq("id", id);
  if (error) throw error;
}

export function checkedToday(ch: Challenge): boolean {
  return ch.last_check_date === todayKey();
}
