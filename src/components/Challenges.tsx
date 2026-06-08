import { useCallback, useEffect, useState } from "react";
import {
  loadChallenges,
  createChallenge,
  checkInChallenge,
  deleteChallenge,
  checkedToday,
  TYPE_LABEL,
  CATEGORY_LABEL,
  SUGGESTED,
  type Challenge,
  type ChallengeType,
  type ChallengeCategory,
} from "@/lib/challenges";

const TABS: ChallengeType[] = ["weekly", "monthly", "yearly"];

export function Challenges({ userId }: { userId: string }) {
  const [list, setList] = useState<Challenge[] | null>(null);
  const [tab, setTab] = useState<ChallengeType>("weekly");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ChallengeCategory>("study");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setList(await loadChallenges(userId));
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function run(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      await reload();
    } finally {
      setBusy(false);
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    await run(async () => {
      await createChallenge(userId, t, category, tab);
      setTitle("");
    });
  }

  function startSuggested(s: { title: string; category: ChallengeCategory }) {
    run(() => createChallenge(userId, s.title, s.category, tab));
  }

  const filtered = (list ?? []).filter((c) => c.challenge_type === tab);

  return (
    <div className="space-y-4">
      {/* type tabs */}
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md border px-3 py-2 text-xs font-bold transition ${
              tab === t
                ? "border-primary bg-primary/10 text-primary glow-primary"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      {/* create */}
      <form onSubmit={add} className="glow-box rounded-lg border border-border bg-card/70 p-4">
        <div className="mb-2 text-xs text-accent glow-accent">// NEW {TYPE_LABEL[tab].toUpperCase()}</div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Study 2 hours daily"
            spellCheck={false}
            className="flex-1 rounded-md border border-border bg-background/60 px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ChallengeCategory)}
            className="rounded-md border border-border bg-background/60 px-2 py-2 text-sm text-foreground outline-none focus:border-primary"
          >
            {(["study", "exercise", "custom"] as ChallengeCategory[]).map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={busy || !title.trim()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
          >
            start
          </button>
        </div>
      </form>

      {/* suggested daily challenges */}
      <div className="rounded-lg border border-border bg-card/60 p-4">
        <div className="mb-2 text-xs text-accent glow-accent">// SUGGESTED DAILY CHALLENGES</div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED.map((s) => (
            <button
              key={s.title}
              onClick={() => startSuggested(s)}
              disabled={busy}
              className="rounded-full border border-border bg-background/40 px-3 py-1.5 text-xs text-foreground transition hover:border-primary hover:text-primary disabled:opacity-40"
            >
              {CATEGORY_LABEL[s.category].split(" ")[0]} {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* active list */}
      {list === null ? (
        <div className="h-32 animate-pulse rounded-lg border border-border bg-card/40" />
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm italic text-muted-foreground">
          No {TYPE_LABEL[tab].toLowerCase()} yet. Start one above to build discipline.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((c) => {
            const pct = Math.round((c.days_completed / c.total_days) * 100);
            const done = c.status === "completed";
            const todayDone = checkedToday(c);
            return (
              <li key={c.id} className="rounded-lg border border-border bg-card/60 p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold text-foreground">{c.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {CATEGORY_LABEL[c.category]} · day {c.days_completed}/{c.total_days}
                    </div>
                  </div>
                  <button
                    onClick={() => run(() => deleteChallenge(c.id))}
                    disabled={busy}
                    aria-label="delete challenge"
                    className="text-muted-foreground/50 transition hover:text-destructive"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
                {done ? (
                  <div className="rounded-md bg-primary/10 py-2 text-center text-xs font-bold text-primary glow-primary">
                    🏆 CHALLENGE COMPLETED
                  </div>
                ) : (
                  <button
                    onClick={() => run(() => checkInChallenge(c))}
                    disabled={busy || todayDone}
                    className={`w-full rounded-md py-2 text-xs font-bold transition ${
                      todayDone
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary text-primary-foreground hover:opacity-90"
                    }`}
                  >
                    {todayDone ? "✓ Done for today" : "Mark today complete"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
