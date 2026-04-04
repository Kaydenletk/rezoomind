export function TipsSection({ hottestCategory, hottestMom }: { hottestCategory: string; hottestMom: number }) {
  return (
    <div className="border-[1.5px] border-stone-200 dark:border-stone-800 rounded-[10px] bg-white dark:bg-stone-900 p-5">
      <div className="flex items-center gap-1.5 mb-4">
        <span className="text-orange-600 font-mono text-xs font-bold">▸</span>
        <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">tips</span>
      </div>

      <div className="space-y-3 text-[12px] text-stone-600 dark:text-stone-300 leading-relaxed">
        <p>
          <span className="text-orange-600 font-mono font-bold mr-2">→</span>
          Apply within 48 hours of a posting going live — early applicants get reviewed first in rolling admissions.
        </p>
        <p>
          <span className="text-orange-600 font-mono font-bold mr-2">→</span>
          Peak season (Sep–Jan) has the most openings but also the most competition. Spring lull positions often have fewer applicants.
        </p>
        <p>
          <span className="text-orange-600 font-mono font-bold mr-2">→</span>
          Currently {hottestCategory} is the fastest-growing category{hottestMom !== 0 ? ` at ${hottestMom > 0 ? "+" : ""}${hottestMom}% this month` : ""}.
        </p>
        <p>
          <span className="text-orange-600 font-mono font-bold mr-2">→</span>
          Set up job alerts now. When September hits, you want to be first in line, not still writing your resume.
        </p>
      </div>
    </div>
  );
}
