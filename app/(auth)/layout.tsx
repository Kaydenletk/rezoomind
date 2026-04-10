import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-stone-50 text-stone-900 transition-colors dark:bg-stone-950 dark:text-stone-100">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute left-[-8rem] top-[-6rem] h-64 w-64 rounded-full bg-orange-500/10 blur-3xl dark:bg-orange-500/15" />
        <div className="absolute bottom-[-8rem] right-[-6rem] h-72 w-72 rounded-full bg-stone-300/40 blur-3xl dark:bg-stone-800/50" />
      </div>

      <header className="relative z-10 border-b border-stone-200/80 bg-white/70 backdrop-blur dark:border-stone-800 dark:bg-stone-950/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center border border-orange-600/40 bg-orange-600/10 font-mono text-xs font-bold text-orange-600">
              R
            </span>
            <span className="font-mono text-[15px] font-bold tracking-wider lowercase text-orange-600">
              rezoomind
            </span>
          </Link>

          <nav className="flex items-center gap-5 font-mono text-xs text-stone-500 dark:text-stone-400">
            <Link href="/" className="transition-colors hover:text-orange-600 dark:hover:text-orange-500">
              home
            </Link>
            <Link href="/dashboard" className="transition-colors hover:text-orange-600 dark:hover:text-orange-500">
              dashboard
            </Link>
            <Link href="/jobs" className="transition-colors hover:text-orange-600 dark:hover:text-orange-500">
              jobs
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        {children}
      </main>

      <footer className="relative z-10 border-t border-stone-200/80 bg-white/60 px-6 py-4 text-center backdrop-blur dark:border-stone-800 dark:bg-stone-950/60">
        <span className="font-mono text-[10px] tracking-wider text-stone-500 dark:text-stone-500">
          © 2025 rezoomind · verified internship alerts and insights
        </span>
      </footer>
    </div>
  );
}
