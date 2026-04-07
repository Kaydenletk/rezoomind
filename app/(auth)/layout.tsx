import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-300 font-mono flex flex-col relative overflow-hidden">
      {/* Background terminal grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #666 1px, transparent 1px), linear-gradient(to bottom, #666 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Terminal-style nav — matches DashboardHeader */}
      <header className="relative z-10 flex items-center justify-between px-7 py-3.5 border-b border-stone-800">
        <div className="flex items-center gap-5">
          {/* Terminal dots */}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-orange-600 bg-orange-600" />
            <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-orange-700" />
            <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-stone-700" />
          </div>
          <Link
            href="/"
            className="font-mono font-bold text-orange-600 text-[15px] tracking-wider lowercase hover:text-orange-500 transition-colors"
          >
            rezoomind
          </Link>
          <span className="text-stone-700">|</span>
          <nav className="hidden sm:flex gap-4">
            <Link
              href="/"
              className="font-mono text-xs text-stone-500 hover:text-orange-500 transition-colors"
            >
              ~/home
            </Link>
            <Link
              href="/jobs"
              className="font-mono text-xs text-stone-500 hover:text-orange-500 transition-colors"
            >
              ~/jobs
            </Link>
          </nav>
        </div>
      </header>

      {/* Centered auth content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        {children}
      </main>

      {/* Minimal footer */}
      <footer className="relative z-10 border-t border-stone-800 px-7 py-4 text-center">
        <span className="text-[10px] text-stone-600 tracking-wider">
          © 2025 rezoomind · internship command center
        </span>
      </footer>
    </div>
  );
}
