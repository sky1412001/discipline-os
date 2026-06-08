import { supabase } from "@/integrations/supabase/client";
import {
  PRIORITY_POINTS,
  STREAK_BONUS,
  PERFECT_DAY_BONUS,
  productivityLevel,
  getRank,
  todayKey,
  type Priority,
} from "./game";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  priority: Priority;
  status: "pending" | "completed";
  points: number;
  time_block: string;
  scheduled_time: string | null;
  created_at: string;
  completed_at: string | null;
}

export type TimeBlock = "morning" | "afternoon" | "evening" | "anytime";

export interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  streak_current: number;
  streak_best: number;
  total_points: number;
  rank_level: number;
}

export interface DayActivity {
  date: string;
  tasks_completed_count: number;
  score: number;
  streak_day: number;
  productivity_level: string;
}

export interface Snapshot {
  profile: Profile | null;
  tasks: Task[];
  activity: DayActivity[];
}

function dateKeyOf(iso: string): string {
  return todayKey(new Date(iso));
}

export async function loadSnapshot(userId: string): Promise<Snapshot> {
  const [{ data: profile }, { data: tasks }, { data: activity }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("tasks").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("daily_activity").select("*").eq("user_id", userId).order("date", { ascending: true }),
  ]);
  return {
    profile: (profile as Profile) ?? null,
    tasks: (tasks as Task[]) ?? [],
    activity: (activity as DayActivity[]) ?? [],
  };
}

export function todaysTasks(tasks: Task[]): Task[] {
  const today = todayKey();
  return tasks.filter((t) => dateKeyOf(t.created_at) === today);
}

export async function addTask(
  userId: string,
  title: string,
  priority: Priority,
  timeBlock: string = "anytime",
  scheduledTime: string | null = null,
) {
  const { error } = await supabase.from("tasks").insert({
    user_id: userId,
    title,
    priority,
    status: "pending",
    points: 0,
    time_block: timeBlock,
    scheduled_time: scheduledTime,
  });
  if (error) throw error;
}

export async function completeTask(task: Task) {
  if (task.status === "completed") return;
  const points = PRIORITY_POINTS[task.priority];
  const { error } = await supabase
    .from("tasks")
    .update({ status: "completed", points, completed_at: new Date().toISOString() })
    .eq("id", task.id);
  if (error) throw error;
}

export async function uncompleteTask(task: Task) {
  if (task.status !== "completed") return;
  const { error } = await supabase
    .from("tasks")
    .update({ status: "pending", points: 0, completed_at: null })
    .eq("id", task.id);
  if (error) throw error;
}

export async function toggleTask(task: Task) {
  if (task.status === "completed") return uncompleteTask(task);
  return completeTask(task);
}

export async function deleteTask(taskId: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;
}

// Recompute today's activity, streak, points and rank, then persist to profile.
export async function syncStats(userId: string): Promise<Snapshot> {
  const snap = await loadSnapshot(userId);
  const today = todayKey();
  const tToday = todaysTasks(snap.tasks);
  const completedToday = tToday.filter((t) => t.status === "completed");

  let score = completedToday.reduce((s, t) => s + t.points, 0);
  if (completedToday.length > 0) score += STREAK_BONUS;
  if (tToday.length > 0 && completedToday.length === tToday.length) score += PERFECT_DAY_BONUS;

  await supabase.from("daily_activity").upsert(
    {
      user_id: userId,
      date: today,
      tasks_completed_count: completedToday.length,
      score,
      productivity_level: productivityLevel(score),
    },
    { onConflict: "user_id,date" },
  );

  // reload activity after upsert
  const { data: actData } = await supabase
    .from("daily_activity")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true });
  const activity = (actData as DayActivity[]) ?? [];

  // streak: consecutive days ending today with score > 0
  const scoreByDate = new Map(activity.map((a) => [a.date, a.score]));
  let streak = 0;
  const cursor = new Date();
  // allow streak to count today only if today has score
  while (true) {
    const key = todayKey(cursor);
    if ((scoreByDate.get(key) ?? 0) > 0) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  const totalPoints = activity.reduce((s, a) => s + a.score, 0);
  const best = Math.max(snap.profile?.streak_best ?? 0, streak);
  const rank = getRank(totalPoints);

  await supabase
    .from("profiles")
    .update({
      streak_current: streak,
      streak_best: best,
      total_points: totalPoints,
      rank_level: rank.level,
    })
    .eq("id", userId);

  // set today's streak_day
  await supabase
    .from("daily_activity")
    .update({ streak_day: streak })
    .eq("user_id", userId)
    .eq("date", today);

  return loadSnapshot(userId);
}
