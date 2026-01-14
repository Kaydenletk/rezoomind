const chips = [
  "Stripe — Product Design Intern",
  "Notion — SWE Intern",
  "Ramp — Growth Analyst Intern",
];

export function HeroSignal() {
  return (
    <div className="relative mx-auto flex w-full max-w-md flex-col gap-6 rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.15)] backdrop-blur transition hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(15,23,42,0.2)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
          Live Signal
        </span>
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
          <span className="signal-live-dot relative inline-flex h-2.5 w-2.5">
            <span className="signal-live-ping absolute inline-flex h-full w-full rounded-full" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[rgb(var(--brand-rgb))] shadow-[0_0_12px_var(--brand-glow)]" />
          </span>
          Live
        </span>
      </div>

      <div className="relative flex items-center justify-center">
        <div className="relative flex h-40 w-40 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-slate-200/80 bg-white/70 shadow-[0_18px_50px_rgba(15,23,42,0.12)]" />
          <div className="absolute inset-3 rounded-full border border-slate-200/70" />
          <div className="signal-radar absolute inset-5 rounded-full" aria-hidden="true" />
          <div className="absolute inset-7 rounded-full bg-gradient-to-br from-[rgba(var(--brand-rgb),0.32)] via-white to-transparent blur-2xl" />
          <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgb(var(--brand-rgb))] shadow-[0_0_18px_var(--brand-glow)]" />
        </div>
      </div>

      <div className="signal-chips relative h-24 overflow-hidden">
        {chips.map((chip, index) => (
          <div
            key={chip}
            className={`signal-chip signal-chip-${index} mx-auto flex w-full max-w-[280px] items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs text-slate-600 shadow-sm`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--brand-rgb))] shadow-[0_0_8px_var(--brand-glow)]" />
            <span className="font-semibold text-slate-700">{chip}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Verified delivery to your inbox.</span>
        <span className="rounded-full border border-[rgba(var(--brand-rgb),0.3)] bg-[var(--brand-tint)] px-3 py-1 text-slate-700">
          Real-time
        </span>
      </div>
    </div>
  );
}
