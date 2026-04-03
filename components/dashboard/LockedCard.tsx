import Link from "next/link";
import { Lock } from "lucide-react";

export function LockedCard() {
  return (
    <div className="border-[1.5px] border-dashed border-stone-200 dark:border-stone-700 rounded-[10px] p-5 bg-stone-50 dark:bg-stone-900 flex flex-col items-center justify-center text-center">
      <div className="flex items-center gap-1.5 mb-4">
        <span className="text-stone-400 font-mono text-[11px]">▸</span>
        <span className="font-mono text-[11px] font-bold text-stone-400">your_matches</span>
      </div>
      <div className="relative mb-4">
        <svg width="70" height="70" viewBox="0 0 70 70" className="blur-[2px] opacity-35">
          <circle cx="35" cy="35" r="25" fill="none" stroke="#e7e5e4" strokeWidth="5" />
          <circle cx="35" cy="35" r="25" fill="none" stroke="#ea580c" strokeWidth="5" strokeDasharray="110 157" transform="rotate(-90 35 35)" />
        </svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Lock className="w-[18px] h-[18px] text-stone-400" />
        </div>
      </div>
      <div className="text-[10px] text-stone-400 leading-relaxed mb-4">
        <span className="text-stone-500 font-semibold">AI matching</span><br />resume analysis<br />saved jobs
      </div>
      <Link href="/login" className="bg-stone-950 dark:bg-orange-600 text-stone-50 px-5 py-2 rounded-md text-xs font-semibold font-mono w-full text-center hover:bg-stone-800 dark:hover:bg-orange-500 transition-colors">
        sign_in →
      </Link>
    </div>
  );
}
