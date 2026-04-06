import Link from "next/link";
import { Sparkles } from "lucide-react";

export function MatchingPreviewCard() {
  return (
    <div className="border-[1.5px] border-stone-200 dark:border-stone-800 rounded-[10px] p-5 bg-white dark:bg-stone-900 flex flex-col">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-orange-600 font-mono text-xs font-bold">▸</span>
        <span className="font-mono text-[11px] font-bold text-stone-500 dark:text-stone-400">matching_preview</span>
      </div>

      <div className="flex items-center justify-center mb-3">
        <div className="w-12 h-12 rounded-[10px] bg-orange-600/10 border border-orange-600/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-orange-500" />
        </div>
      </div>

      <p className="text-[11px] text-stone-500 dark:text-stone-400 text-center leading-relaxed mb-3">
        Upload your resume to see which roles match your skills.
      </p>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-[10px] text-stone-400">
          <span className="text-orange-600">+</span>
          <span>AI match scores by skill overlap</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-stone-400">
          <span className="text-orange-600">+</span>
          <span>Gap analysis for missing keywords</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-stone-400">
          <span className="text-orange-600">+</span>
          <span>One-click resume tailoring</span>
        </div>
      </div>

      <div className="text-[9px] uppercase tracking-[0.2em] text-stone-400 font-mono text-center mb-3">
        Sign in to get started
      </div>

      <Link
        href="/login"
        className="bg-stone-950 dark:bg-orange-600 text-stone-50 px-5 py-2 rounded-md text-xs font-semibold font-mono w-full text-center hover:bg-stone-800 dark:hover:bg-orange-500 transition-colors"
      >
        sign_up for early access →
      </Link>
    </div>
  );
}
