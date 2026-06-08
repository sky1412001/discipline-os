import {
  addTask,
  completeTask,
  todaysTasks,
  type Snapshot,
} from "./disciplineData";
import {
  getRank,
  getNextRank,
  rankProgress,
  PRIORITY_POINTS,
  type Priority,
} from "./game";

export interface Line {
  text: string;
  kind: "input" | "output" | "error" | "success" | "info";
}

export interface CommandResult {
  lines: Line[];
  mutated: boolean;
  clear?: boolean;
}

const HELP: Line[] = [
  { text: "AVAILABLE COMMANDS", kind: "info" },
  { text: '  add "task name" <A|B|C|D>   add a task (A=10 B=7 C=5 D=2 pts)', kind: "output" },
  { text: "  done <n>                   complete task #n from today's list", kind: "output" },
  { text: "  list [today|pending|all]   list tasks", kind: "output" },
  { text: "  stats                      show productivity stats", kind: "output" },
  { text: "  rank                       show rank & progress", kind: "output" },
  { text: "  clear                      clear the terminal", kind: "output" },
  { text: "  help                       show this menu", kind: "output" },
];

export async function runCommand(input: string, userId: string, snap: Snapshot): Promise<CommandResult> {
  const raw = input.trim();
  if (!raw) return { lines: [], mutated: false };
  const lines: Line[] = [{ text: `$ ${raw}`, kind: "input" }];
  const lower = raw.toLowerCase();

  try {
    if (lower === "help") {
      return { lines: [...lines, ...HELP], mutated: false };
    }

    if (lower === "clear") {
      return { lines: [], mutated: false, clear: true };
    }

    if (lower.startsWith("add")) {
      const m = raw.match(/^add\s+"([^"]+)"\s+([ABCDabcd])\s*$/);
      if (!m) {
        lines.push({ text: 'usage: add "task name" <A|B|C|D>', kind: "error" });
        return { lines, mutated: false };
      }
      const title = m[1];
      const priority = m[2].toUpperCase() as Priority;
      await addTask(userId, title, priority);
      lines.push({
        text: `+ added [${priority}] "${title}" (${PRIORITY_POINTS[priority]} pts on completion)`,
        kind: "success",
      });
      return { lines, mutated: true };
    }

    if (lower.startsWith("done")) {
      const m = raw.match(/^done\s+(\d+)\s*$/);
      if (!m) {
        lines.push({ text: "usage: done <task number>", kind: "error" });
        return { lines, mutated: false };
      }
      const idx = parseInt(m[1], 10) - 1;
      const list = todaysTasks(snap.tasks);
      const task = list[idx];
      if (!task) {
        lines.push({ text: `! no task #${idx + 1} in today's list (run: list today)`, kind: "error" });
        return { lines, mutated: false };
      }
      if (task.status === "completed") {
        lines.push({ text: `! task #${idx + 1} already completed`, kind: "error" });
        return { lines, mutated: false };
      }
      await completeTask(task);
      lines.push({
        text: `✔ completed "${task.title}" (+${PRIORITY_POINTS[task.priority]} pts)`,
        kind: "success",
      });
      return { lines, mutated: true };
    }

    if (lower.startsWith("list")) {
      const arg = lower.split(/\s+/)[1] ?? "today";
      let tasks = snap.tasks;
      if (arg === "today") tasks = todaysTasks(snap.tasks);
      else if (arg === "pending") tasks = snap.tasks.filter((t) => t.status === "pending");
      else if (arg === "all") tasks = snap.tasks;
      else {
        lines.push({ text: "usage: list [today|pending|all]", kind: "error" });
        return { lines, mutated: false };
      }

      // numbering for done refers to today's list
      const todayList = todaysTasks(snap.tasks);
      if (tasks.length === 0) {
        lines.push({ text: `no tasks (${arg})`, kind: "info" });
        return { lines, mutated: false };
      }
      lines.push({ text: `── ${arg.toUpperCase()} (${tasks.length}) ──`, kind: "info" });
      tasks.forEach((t) => {
        const n = todayList.indexOf(t);
        const num = n >= 0 ? `#${n + 1}` : "  ";
        const box = t.status === "completed" ? "[x]" : "[ ]";
        lines.push({
          text: `${num.padEnd(4)} ${box} [${t.priority}] ${t.title}`,
          kind: t.status === "completed" ? "success" : "output",
        });
      });
      return { lines, mutated: false };
    }

    if (lower === "stats") {
      const p = snap.profile;
      const total = snap.tasks.length;
      const completed = snap.tasks.filter((t) => t.status === "completed").length;
      const rate = total ? Math.round((completed / total) * 100) : 0;
      lines.push({ text: "── STATS ──", kind: "info" });
      lines.push({ text: `total tasks      : ${total}`, kind: "output" });
      lines.push({ text: `completed tasks  : ${completed}`, kind: "output" });
      lines.push({ text: `completion rate  : ${rate}%`, kind: "output" });
      lines.push({ text: `total points     : ${p?.total_points ?? 0}`, kind: "output" });
      lines.push({ text: `current streak   : ${p?.streak_current ?? 0} days`, kind: "output" });
      lines.push({ text: `best streak      : ${p?.streak_best ?? 0} days`, kind: "output" });
      return { lines, mutated: false };
    }

    if (lower === "rank") {
      const points = snap.profile?.total_points ?? 0;
      const rank = getRank(points);
      const next = getNextRank(points);
      const prog = rankProgress(points);
      const filled = Math.round(prog / 5);
      const bar = "█".repeat(filled) + "░".repeat(20 - filled);
      lines.push({ text: "── RANK ──", kind: "info" });
      lines.push({ text: `${rank.name}  (LVL ${rank.level}/10)`, kind: "success" });
      lines.push({ text: `[${bar}] ${prog}%`, kind: "output" });
      lines.push({
        text: next ? `${next.min - points} pts to ${next.name}` : "MAX RANK — GOD MODE",
        kind: "info",
      });
      return { lines, mutated: false };
    }

    lines.push({ text: `command not found: ${raw.split(/\s+/)[0]} (try: help)`, kind: "error" });
    return { lines, mutated: false };
  } catch (err) {
    lines.push({ text: `! error: ${err instanceof Error ? err.message : "unknown"}`, kind: "error" });
    return { lines, mutated: false };
  }
}
