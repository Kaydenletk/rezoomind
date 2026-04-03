import Link from "next/link";

export function DashboardHeader() {
  return (
    <header className="flex items-center justify-between px-7 py-3.5 border-b border-stone-200">
      <div className="flex items-center gap-5">
        {/* Terminal dots */}
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-orange-600 bg-orange-600" />
          <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-orange-300" />
          <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-stone-200" />
        </div>
        <span className="font-mono font-bold text-orange-600 text-[15px] tracking-wider lowercase">
          rezoomind
        </span>
        <span className="text-stone-300">|</span>
        <nav className="hidden sm:flex gap-4">
          <a href="#jobs" className="font-mono text-xs text-stone-500 hover:text-orange-600 transition-colors">~/jobs</a>
          <a href="#insights" className="font-mono text-xs text-stone-500 hover:text-orange-600 transition-colors">~/insights</a>
        </nav>
      </div>
      <Link href="/login" className="border-[1.5px] border-orange-600 text-orange-600 px-4 py-1.5 rounded font-mono text-xs font-semibold tracking-wide hover:bg-orange-600 hover:text-white transition-colors">
        sign_in →
      </Link>
    </header>
  );
}
