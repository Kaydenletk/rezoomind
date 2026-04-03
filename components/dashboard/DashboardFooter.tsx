import Link from "next/link";

export function DashboardFooter() {
  return (
    <footer className="flex items-center justify-between px-7 py-4 border-t border-stone-100 dark:border-stone-800">
      <div className="flex items-center gap-2 font-mono">
        <span className="text-[11px] text-stone-300">$</span>
        <span className="text-[11px] text-stone-400">
          rezoomind · data from{" "}
          <a href="https://github.com/speedyapply/2026-SWE-College-Jobs" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">speedyapply</a>
          {" "}· updated daily
        </span>
      </div>
      <div className="flex gap-3.5 font-mono">
        <Link href="/about" className="text-[11px] text-stone-400 hover:text-stone-600 transition-colors">about</Link>
        <a href="https://github.com/speedyapply/2026-SWE-College-Jobs" target="_blank" rel="noopener noreferrer" className="text-[11px] text-stone-400 hover:text-stone-600 transition-colors">github</a>
      </div>
    </footer>
  );
}
