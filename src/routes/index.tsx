import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DISCIPLINE OS — Turn Productivity Into a Hacker RPG" },
      {
        name: "description",
        content:
          "A hacker-terminal productivity OS. Run command-line tasks, build streaks, climb 10 discipline ranks and track a GitHub-style activity heatmap.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen scanlines">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-primary glow-primary">●</span>
          <span className="font-bold tracking-wide">
            DISCIPLINE<span className="text-primary">_OS</span>
          </span>
        </div>
        <Link
          to="/auth"
          className="rounded-md border border-border px-4 py-1.5 text-sm text-foreground transition hover:border-primary hover:text-primary"
        >
          access terminal
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <div className="mb-4 text-sm text-accent glow-accent">root@discipline:~$ ./start</div>
        <h1 className="text-4xl font-bold leading-tight text-foreground sm:text-5xl">
          Turn your discipline into a{" "}
          <span className="text-primary glow-primary">hacker RPG</span>.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
          Log tasks with terminal commands. Earn points, build streaks, climb 10 ranks from{" "}
          <span className="text-foreground">Rookie</span> to{" "}
          <span className="text-primary">GOD MODE</span>, and watch your consistency light up a
          GitHub-style heatmap.
        </p>

        <div className="mt-8 flex justify-center gap-3">
          <Link
            to="/auth"
            className="glow-box rounded-md bg-primary px-6 py-3 font-bold text-primary-foreground transition hover:opacity-90"
          >
            [ BOOT THE SYSTEM ]
          </Link>
        </div>

        <div className="glow-box mx-auto mt-14 max-w-lg rounded-lg border border-border bg-card/70 p-5 text-left font-mono text-[13px]">
          <div className="text-muted-foreground">$ add "Study Math" A</div>
          <div className="text-primary">+ added [A] "Study Math" (10 pts on completion)</div>
          <div className="mt-1 text-muted-foreground">$ done 1</div>
          <div className="text-primary">✔ completed "Study Math" (+10 pts)</div>
          <div className="mt-1 text-muted-foreground">$ rank</div>
          <div className="text-accent">Focused Student (LVL 3/10)</div>
          <div className="text-muted-foreground">[████████░░░░░░░░░░░░] 40%</div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
          <Feature title="Command tasks" body="add, done, list, stats, rank — pure keyboard flow." />
          <Feature title="Streaks & ranks" body="Daily streak bonuses and 10 levels of discipline." />
          <Feature title="Activity heatmap" body="A year of consistency visualized at a glance." />
        </div>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
        DISCIPLINE_OS // discipline as a service
      </footer>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border bg-card/70 p-4">
      <div className="font-bold text-primary">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{body}</div>
    </div>
  );
}
