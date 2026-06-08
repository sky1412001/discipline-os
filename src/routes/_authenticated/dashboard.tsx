import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  loadSnapshot,
  syncStats,
  addTask,
  toggleTask,
  deleteTask,
  todaysTasks,
  type Snapshot,
  type Task,
  type TimeBlock,
} from "@/lib/disciplineData";
import { type Priority } from "@/lib/game";
import { StatsPanel } from "@/components/StatsPanel";
import { Heatmap } from "@/components/Heatmap";
import { Timetable } from "@/components/Timetable";
import { Challenges } from "@/components/Challenges";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [{ title: "Dashboard — Discipline OS" }],
  }),
  component: Dashboard,
});

type MainTab = "timetable" | "challenges";

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [range, setRange] = useState<"30d" | "1y">("1y");
  const [tab, setTab] = useState<MainTab>("timetable");

  const reload = useCallback(async () => {
    if (!user) return;
    setSnap(await loadSnapshot(user.id));
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function sync() {
    if (!user) return;
    setSnap(await syncStats(user.id));
  }

  async function onAdd(title: string, priority: Priority, block: TimeBlock, time: string | null) {
    if (!user || busy) return;
    setBusy(true);
    try {
      await addTask(user.id, title, priority, block, time);
      await sync();
    } finally {
      setBusy(false);
    }
  }

  async function onToggle(task: Task) {
    if (!user || busy) return;
    setBusy(true);
    try {
      await toggleTask(task);
      await sync();
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(task: Task) {
    if (!user || busy) return;
    setBusy(true);
    try {
      await deleteTask(task.id);
      await sync();
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const username = snap?.profile?.username ?? user?.email?.split("@")[0] ?? "user";
  const tToday = snap ? todaysTasks(snap.tasks) : [];

  return (
    <div className="min-h-screen scanlines">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-primary glow-primary">●</span>
          <h1 className="font-bold tracking-wide text-foreground">
            DISCIPLINE<span className="text-primary">_OS</span>
          </h1>
          <span className="hidden text-xs text-muted-foreground sm:inline">/ {username}</span>
        </div>
        <button
          onClick={signOut}
          className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:border-destructive hover:text-destructive"
        >
          logout
        </button>
      </header>

      {/* main tabs */}
      <div className="mx-auto flex max-w-7xl gap-2 px-4 pt-4">
        {([
          { key: "timetable", label: "🗓️ Timetable" },
          { key: "challenges", label: "🔥 Challenges" },
        ] as { key: MainTab; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md border px-4 py-2 text-sm font-bold transition ${
              tab === t.key
                ? "border-primary bg-primary/10 text-primary glow-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4">
          {tab === "timetable" ? (
            !snap ? (
              <SkeletonPanel />
            ) : (
              <Timetable
                tasks={tToday}
                busy={busy}
                onAdd={onAdd}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            )
          ) : user ? (
            <Challenges userId={user.id} />
          ) : null}
        </section>

        <aside>{snap ? <StatsPanel snap={snap} /> : <SkeletonPanel />}</aside>
      </main>

      <section className="mx-auto max-w-7xl p-4">
        <div className="rounded-lg border border-border bg-card/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-xs text-accent glow-accent">// ACTIVITY HEATMAP</div>
            <div className="flex gap-1 text-xs">
              {(["30d", "1y"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`rounded px-2 py-1 transition ${
                    range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          {snap ? <Heatmap activity={snap.activity} range={range} /> : <SkeletonPanel />}
        </div>
      </section>
    </div>
  );
}

function SkeletonPanel() {
  return <div className="h-40 animate-pulse rounded-lg border border-border bg-card/40" />;
}
