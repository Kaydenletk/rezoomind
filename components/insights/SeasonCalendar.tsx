const MONTHS = [
  { label: "Jan", season: "peak" },
  { label: "Feb", season: "winding-down" },
  { label: "Mar", season: "winding-down" },
  { label: "Apr", season: "lull" },
  { label: "May", season: "lull" },
  { label: "Jun", season: "lull" },
  { label: "Jul", season: "lull" },
  { label: "Aug", season: "ramping-up" },
  { label: "Sep", season: "peak" },
  { label: "Oct", season: "peak" },
  { label: "Nov", season: "peak" },
  { label: "Dec", season: "peak" },
] as const;

const SEASON_BG: Record<string, string> = {
  peak: "bg-green-500/20 dark:bg-green-500/10",
  "winding-down": "bg-orange-500/20 dark:bg-orange-500/10",
  lull: "bg-stone-200 dark:bg-stone-800",
  "ramping-up": "bg-blue-500/20 dark:bg-blue-500/10",
};

const SEASON_TEXT: Record<string, string> = {
  peak: "text-green-600 dark:text-green-400",
  "winding-down": "text-orange-600 dark:text-orange-400",
  lull: "text-stone-400 dark:text-stone-500",
  "ramping-up": "text-blue-600 dark:text-blue-400",
};

export function SeasonCalendar() {
  const currentMonth = new Date().getMonth(); // 0-indexed

  return (
    <div className="border-[1.5px] border-stone-200 dark:border-stone-800 rounded-[10px] bg-white dark:bg-stone-900 p-5">
      <div className="flex items-center gap-1.5 mb-4">
        <span className="text-orange-600 font-mono text-xs font-bold">▸</span>
        <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">hiring_calendar</span>
      </div>

      <div className="grid grid-cols-6 md:grid-cols-12 gap-1.5">
        {MONTHS.map((m, i) => (
          <div
            key={m.label}
            className={`rounded-md p-2 text-center ${SEASON_BG[m.season]} ${
              i === currentMonth ? "ring-2 ring-orange-600" : ""
            }`}
          >
            <div className={`text-[10px] font-mono font-semibold ${i === currentMonth ? "text-orange-600" : "text-stone-600 dark:text-stone-300"}`}>
              {m.label}
            </div>
            <div className={`text-[8px] font-mono mt-0.5 ${SEASON_TEXT[m.season]}`}>
              {m.season === "winding-down" ? "wind" : m.season === "ramping-up" ? "ramp" : m.season}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 mt-3 text-[9px] font-mono text-stone-400">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500/30" /> Peak (Sep-Jan)</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-orange-500/30" /> Transition</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-stone-300 dark:bg-stone-700" /> Lull (Apr-Jul)</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500/30" /> Ramp Up</span>
      </div>
    </div>
  );
}
