import { getRank, getNextRank, rankProgress } from "@/lib/game";
import { todaysTasks, type Snapshot } from "@/lib/disciplineData";

export function StatsPanel({ snap }: { snap: Snapshot }) {
  const points = snap.profile?.total_points ?? 0;
  const rank = getRank(points);
  const next = getNextRank(points);
  const progress = rankProgress(points);
  const streak = snap.profile?.streak_current ?? 0;
  const best = snap.profile?.streak_best ?? 0;

  const total = snap.tasks.length;
  const completed = snap.tasks.filter((t) => t.status === "completed").length;
  const rate = total ? Math.round((completed / total) * 100) : 0;
  const tToday = todaysTasks(snap.tasks);
  const doneToday = tToday.filter((t) => t.status === "completed").length;
  const avgScore = snap.activity.length
    ? Math.round(snap.activity.reduce((s, a) => s + a.score, 0) / snap.activity.length)
    : 0;

  const insights = buildInsights({ points, next, streak, snap, rate });

  return (
    <div className="space-y-4 text-sm">
      <section className="glow-box rounded-lg border border-border bg-card/70 p-4">
        <div className="text-xs text-muted-foreground">// RANK</div>
        <div className="mt-1 text-xl font-bold text-primary glow-primary">
          {rank.name} {rank.level === 10 && "🔥"}
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%`, boxShadow: "0 0 10px var(--primary)" }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
          <span>LVL {rank.level}/10</span>
          <span>{next ? `${next.min - points} pts → ${next.name}` : "MAX RANK"}</span>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="streak" value={`${streak}🔥`} accent />
        <Stat label="best streak" value={`${best}`} />
        <Stat label="total points" value={`${points}`} accent />
        <Stat label="avg day score" value={`${avgScore}`} />
        <Stat label="completed" value={`${completed}/${total}`} />
        <Stat label="completion" value={`${rate}%`} />
      </div>

      <section className="rounded-lg border border-border bg-card/70 p-4">
        <div className="text-xs text-muted-foreground">// TODAY</div>
        <div className="mt-1 text-foreground">
          {doneToday}/{tToday.length} tasks done
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card/70 p-4">
        <div className="mb-2 text-xs text-accent glow-accent">// INSIGHT ENGINE</div>
        <ul className="space-y-2 text-[13px] text-muted-foreground">
          {insights.map((line, i) => (
            <li key={i} className="leading-snug">
              <span className="text-primary">▸ </span>
              {line}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card/70 p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-lg font-bold ${accent ? "text-primary glow-primary" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}

function buildInsights({
  points,
  next,
  streak,
  snap,
  rate,
}: {
  points: number;
  next: ReturnType<typeof getNextRank>;
  streak: number;
  snap: Snapshot;
  rate: number;
}): string[] {
  const out: string[] = [];

  if (next) {
    const gap = next.min - points;
    const recentAvg =
      snap.activity.slice(-7).reduce((s, a) => s + a.score, 0) / Math.max(1, Math.min(7, snap.activity.length));
    if (recentAvg > 0) {
      const days = Math.ceil(gap / recentAvg);
      out.push(`You are ~${days} day${days === 1 ? "" : "s"} away from upgrading to ${next.name}.`);
    } else {
      out.push(`Earn ${gap} more points to reach ${next.name}.`);
    }
  } else {
    out.push("You've reached GOD MODE. Maintain dominance.");
  }

  if (streak >= 3) out.push(`Focus streak active: ${streak} days strong. Don't break the chain.`);
  else if (streak === 0) out.push("No active streak. Complete a task today to ignite one.");

  // weekend weakness detection
  const byDow: Record<number, { sum: number; n: number }> = {};
  for (const a of snap.activity) {
    const dow = new Date(a.date + "T00:00:00").getDay();
    byDow[dow] = byDow[dow] || { sum: 0, n: 0 };
    byDow[dow].sum += a.score;
    byDow[dow].n++;
  }
  const weekend = [(byDow[0]?.sum ?? 0) + (byDow[6]?.sum ?? 0), (byDow[0]?.n ?? 0) + (byDow[6]?.n ?? 0)];
  const weekdaySum = [1, 2, 3, 4, 5].reduce((s, d) => s + (byDow[d]?.sum ?? 0), 0);
  const weekdayN = [1, 2, 3, 4, 5].reduce((s, d) => s + (byDow[d]?.n ?? 0), 0);
  if (weekend[1] > 0 && weekdayN > 0) {
    const we = weekend[0] / weekend[1];
    const wd = weekdaySum / weekdayN;
    if (we < wd * 0.6) out.push("Your productivity drops on weekends. Schedule light wins for Sat/Sun.");
  }

  if (rate >= 80 && snap.tasks.length >= 5) out.push(`Elite completion rate: ${rate}%. You finish what you start.`);

  return out.slice(0, 4);
}
