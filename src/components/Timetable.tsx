import { useState } from "react";
import { PRIORITY_POINTS, type Priority } from "@/lib/game";
import type { Task, TimeBlock } from "@/lib/disciplineData";

const BLOCKS: { key: TimeBlock; label: string; icon: string; hint: string }[] = [
  { key: "morning", label: "Morning", icon: "🌅", hint: "5am – 12pm" },
  { key: "afternoon", label: "Afternoon", icon: "☀️", hint: "12pm – 5pm" },
  { key: "evening", label: "Evening", icon: "🌙", hint: "5pm – late" },
  { key: "anytime", label: "Anytime", icon: "⚡", hint: "no fixed time" },
];

const PRIORITIES: Priority[] = ["A", "B", "C", "D"];

export function Timetable({
  tasks,
  busy,
  onAdd,
  onToggle,
  onDelete,
}: {
  tasks: Task[];
  busy: boolean;
  onAdd: (title: string, priority: Priority, block: TimeBlock, time: string | null) => void;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("C");
  const [block, setBlock] = useState<TimeBlock>("morning");
  const [time, setTime] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t || busy) return;
    onAdd(t, priority, block, time || null);
    setTitle("");
    setTime("");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="glow-box rounded-lg border border-border bg-card/70 p-4">
        <div className="mb-2 text-xs text-accent glow-accent">// SCHEDULE A TASK</div>
        <div className="flex flex-col gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's on your timetable?"
            spellCheck={false}
            className="w-full rounded-md border border-border bg-background/60 px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
          <div className="flex flex-wrap gap-2">
            <select
              value={block}
              onChange={(e) => setBlock(e.target.value as TimeBlock)}
              className="rounded-md border border-border bg-background/60 px-2 py-2 text-sm text-foreground outline-none focus:border-primary"
            >
              {BLOCKS.map((b) => (
                <option key={b.key} value={b.key}>
                  {b.icon} {b.label}
                </option>
              ))}
            </select>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-md border border-border bg-background/60 px-2 py-2 text-sm text-foreground outline-none focus:border-primary"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="rounded-md border border-border bg-background/60 px-2 py-2 text-sm text-foreground outline-none focus:border-primary"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p} · {PRIORITY_POINTS[p]}pts
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={busy || !title.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
            >
              add
            </button>
          </div>
        </div>
      </form>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {BLOCKS.map((b) => {
          const items = tasks
            .filter((t) => (t.time_block || "anytime") === b.key)
            .sort((a, c) => (a.scheduled_time ?? "").localeCompare(c.scheduled_time ?? ""));
          return (
            <div key={b.key} className="rounded-lg border border-border bg-card/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <span>{b.icon}</span>
                  <span>{b.label}</span>
                  <span className="text-[10px] font-normal text-muted-foreground">{b.hint}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {items.filter((t) => t.status === "completed").length}/{items.length}
                </span>
              </div>
              {items.length === 0 ? (
                <p className="py-4 text-center text-xs italic text-muted-foreground">empty slot</p>
              ) : (
                <ul className="space-y-2">
                  {items.map((task) => {
                    const done = task.status === "completed";
                    return (
                      <li
                        key={task.id}
                        className="group flex items-center gap-2 rounded-md border border-border bg-background/40 px-2.5 py-2 transition hover:border-primary/50"
                      >
                        <button
                          onClick={() => onToggle(task)}
                          disabled={busy}
                          aria-label={done ? "mark incomplete" : "mark complete"}
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
                            done
                              ? "border-primary bg-primary text-primary-foreground glow-primary"
                              : "border-muted-foreground/50 hover:border-primary"
                          }`}
                        >
                          {done && (
                            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                        {task.scheduled_time && (
                          <span className="shrink-0 font-mono text-[10px] text-accent">{task.scheduled_time}</span>
                        )}
                        <span className={`flex-1 text-sm ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                          {task.title}
                        </span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                          {task.priority}
                        </span>
                        <button
                          onClick={() => onDelete(task)}
                          disabled={busy}
                          aria-label="delete task"
                          className="text-muted-foreground/50 opacity-0 transition hover:text-destructive group-hover:opacity-100"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                          </svg>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
