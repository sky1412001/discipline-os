import { heatLevel, todayKey } from "@/lib/game";
import type { DayActivity } from "@/lib/disciplineData";

const HEAT_COLORS = [
  "color-mix(in oklab, var(--muted) 70%, transparent)",
  "color-mix(in oklab, var(--primary) 25%, var(--muted))",
  "color-mix(in oklab, var(--primary) 50%, var(--muted))",
  "color-mix(in oklab, var(--primary) 75%, var(--background))",
  "var(--neon)",
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function buildDays(rangeDays: number) {
  const days: Date[] = [];
  const end = new Date();
  // start so that grid begins on a Sunday
  const start = new Date();
  start.setDate(start.getDate() - (rangeDays - 1));
  // back up to Sunday
  start.setDate(start.getDate() - start.getDay());
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

export function Heatmap({
  activity,
  range,
}: {
  activity: DayActivity[];
  range: "30d" | "1y";
}) {
  const rangeDays = range === "1y" ? 364 : 30;
  const days = buildDays(rangeDays);
  const scoreByDate = new Map(activity.map((a) => [a.date, a.score]));
  const today = todayKey();

  // group into weeks (columns)
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  // month labels per week column
  const monthLabels = weeks.map((week, i) => {
    const first = week[0];
    const prev = i > 0 ? weeks[i - 1][0] : null;
    if (!prev || prev.getMonth() !== first.getMonth()) {
      return MONTHS[first.getMonth()];
    }
    return "";
  });

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div className="flex gap-[3px] pl-7 text-[10px] text-muted-foreground">
          {monthLabels.map((m, i) => (
            <div key={i} className="w-[13px] shrink-0">
              {m}
            </div>
          ))}
        </div>
        <div className="flex">
          <div className="mr-1 flex flex-col gap-[3px] pt-[2px] text-[9px] text-muted-foreground">
            <span className="h-[10px]" />
            <span className="h-[10px]">Mon</span>
            <span className="h-[10px]" />
            <span className="h-[10px]">Wed</span>
            <span className="h-[10px]" />
            <span className="h-[10px]">Fri</span>
            <span className="h-[10px]" />
          </div>
          <div className="flex gap-[3px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((d) => {
                  const key = todayKey(d);
                  const future = d > new Date();
                  const score = scoreByDate.get(key) ?? 0;
                  const lvl = heatLevel(score);
                  return (
                    <div
                      key={key}
                      title={future ? key : `${key}: ${score} pts`}
                      className="h-[11px] w-[11px] rounded-[2px]"
                      style={{
                        backgroundColor: future ? "transparent" : HEAT_COLORS[lvl],
                        outline: key === today ? "1px solid var(--accent)" : "none",
                        outlineOffset: "1px",
                        opacity: future ? 0.15 : 1,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>Less</span>
          {HEAT_COLORS.map((c, i) => (
            <div key={i} className="h-[11px] w-[11px] rounded-[2px]" style={{ backgroundColor: c }} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
