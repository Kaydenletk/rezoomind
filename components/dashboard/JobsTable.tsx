import Link from "next/link";

interface Posting {
  id: string;
  company: string;
  role: string;
  location: string;
  url: string;
  datePosted: string;
  category: string;
}

const CATEGORY_DOT_COLORS: Record<string, string> = {
  "usa-intern": "#3b82f6",
  "usa-newgrad": "#22c55e",
  "intl-intern": "#a855f7",
  "intl-newgrad": "#ef4444",
};

export function JobsTable({ postings }: { postings: Posting[] }) {
  return (
    <div id="jobs" className="border-[1.5px] border-stone-200 dark:border-stone-800 rounded-[10px] bg-white dark:bg-stone-900 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-1.5">
          <span className="text-orange-600 font-mono text-xs">▸</span>
          <span className="font-mono text-sm font-bold text-stone-950 dark:text-stone-50">internships</span>
          <span className="text-[10px] bg-orange-50 dark:bg-orange-950 text-orange-600 px-1.5 rounded font-semibold border border-orange-200 dark:border-orange-800 ml-1">
            {postings.length}
          </span>
        </div>
        <Link href="/jobs" className="text-[11px] text-orange-600 font-semibold font-mono hover:underline">
          view_all →
        </Link>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[2fr_1.5fr_1fr_60px_80px] gap-2 px-5 py-2 bg-stone-50 dark:bg-stone-950 border-b border-stone-100 dark:border-stone-800">
        <span className="text-[9px] text-stone-400 uppercase tracking-widest font-mono">Company</span>
        <span className="text-[9px] text-stone-400 uppercase tracking-widest font-mono">Role</span>
        <span className="text-[9px] text-stone-400 uppercase tracking-widest font-mono hidden md:block">Location</span>
        <span className="text-[9px] text-stone-400 uppercase tracking-widest font-mono hidden md:block">Age</span>
        <span className="text-[9px] text-stone-400 uppercase tracking-widest font-mono text-right">Apply</span>
      </div>

      {/* Scrollable job rows */}
      <div className="overflow-y-auto max-h-[60vh] min-h-[200px]">
        {postings.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-stone-400">
            Loading jobs...
          </div>
        ) : (
          postings.map((job, i) => (
            <div
              key={job.id}
              className={`grid grid-cols-[2fr_1.5fr_1fr_60px_80px] gap-2 px-5 py-2.5 items-center hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors ${
                i < postings.length - 1 ? "border-b border-stone-50 dark:border-stone-800/50" : ""
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CATEGORY_DOT_COLORS[job.category] ?? "#a8a29e" }}
                />
                <span className="text-xs font-semibold text-stone-950 dark:text-stone-100 truncate">
                  {job.company}
                </span>
              </div>
              <span className="text-xs text-stone-700 dark:text-stone-300 truncate">{job.role}</span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 truncate hidden md:block">{job.location}</span>
              <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono hidden md:block">{job.datePosted || "—"}</span>
              <div className="text-right">
                {job.url ? (
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-mono font-semibold text-orange-600 hover:text-orange-500 border border-orange-200 dark:border-orange-800 px-2 py-0.5 rounded hover:bg-orange-50 dark:hover:bg-orange-950 transition-colors"
                  >
                    apply →
                  </a>
                ) : (
                  <span className="text-[10px] text-stone-300 dark:text-stone-600 font-mono">closed</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
