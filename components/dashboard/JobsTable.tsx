import Link from "next/link";

interface Posting {
  id: string;
  title: string;
  company: string;
  location: string | null;
  postedAt: string;
  category: string;
  url: string | null;
}

const CATEGORY_DOT_COLORS: Record<string, string> = {
  "usa-intern": "#3b82f6",
  "usa-newgrad": "#22c55e",
  "intl-intern": "#a855f7",
  "intl-newgrad": "#ef4444",
  uncategorized: "#a8a29e",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "now";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function JobsTable({ postings }: { postings: Posting[] }) {
  return (
    <div id="jobs" className="border-[1.5px] border-stone-200 dark:border-stone-800 rounded-[10px] bg-white dark:bg-stone-900 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-1.5">
          <span className="text-orange-600 font-mono text-xs">▸</span>
          <span className="font-mono text-[13px] font-bold text-stone-950 dark:text-stone-50">recent_postings</span>
          <span className="text-[10px] bg-orange-50 dark:bg-orange-950 text-orange-600 px-1.5 rounded font-semibold border border-orange-200 dark:border-orange-800">new</span>
        </div>
        <Link href="/jobs" className="text-[11px] text-orange-600 font-semibold font-mono hover:underline">view_all →</Link>
      </div>
      <div className="grid grid-cols-[2fr_1.2fr_1fr_0.6fr] gap-1.5 px-5 py-2 bg-stone-50 dark:bg-stone-950 border-b border-stone-100 dark:border-stone-800">
        <span className="text-[9px] text-stone-400 uppercase tracking-widest">Role</span>
        <span className="text-[9px] text-stone-400 uppercase tracking-widest">Company</span>
        <span className="text-[9px] text-stone-400 uppercase tracking-widest hidden md:block">Location</span>
        <span className="text-[9px] text-stone-400 uppercase tracking-widest text-right">Time</span>
      </div>
      {postings.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-stone-400">No recent postings</div>
      ) : (
        postings.map((job) => (
          <div key={job.id} className="grid grid-cols-[2fr_1.2fr_1fr_0.6fr] gap-1.5 px-5 py-2.5 border-b border-stone-50 dark:border-stone-800/50 items-center">
            <span className="text-xs font-semibold text-stone-950 dark:text-stone-100 truncate">{job.title}</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_DOT_COLORS[job.category] ?? "#a8a29e" }} />
              <span className="text-xs text-stone-700 dark:text-stone-300 truncate">{job.company}</span>
            </div>
            <span className="text-[11px] text-stone-500 dark:text-stone-400 truncate hidden md:block">{job.location ?? "—"}</span>
            <span className="text-[10px] text-stone-400 text-right">{timeAgo(job.postedAt)}</span>
          </div>
        ))
      )}
    </div>
  );
}
