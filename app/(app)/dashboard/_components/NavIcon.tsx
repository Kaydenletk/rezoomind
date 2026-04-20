import Link from "next/link";

export function NavIcon({
  icon,
  label,
  active,
  href,
  badge,
  badgeColor,
  small,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  href?: string;
  badge?: string;
  badgeColor?: "purple" | "orange";
  small?: boolean;
}) {
  const size = small ? "w-9 h-9" : "w-10 h-10";
  const className = `${size} flex items-center justify-center transition-all relative group ${
    active
      ? "bg-orange-600/10 text-orange-500"
      : "text-stone-500 hover:text-stone-300 hover:bg-stone-800/50"
  }`;

  const content = (
    <>
      {icon}
      {badge && (
        <span
          className={`absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-bold font-mono ${
            badgeColor === "purple"
              ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
              : "bg-orange-600/10 text-orange-500 border border-orange-600/30"
          }`}
        >
          {badge}
        </span>
      )}
      <span className="absolute left-full ml-3 px-2 py-1 bg-stone-800 text-stone-200 text-xs font-mono opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
        {label}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} title={label}>
        {content}
      </Link>
    );
  }

  return (
    <button className={className} title={label}>
      {content}
    </button>
  );
}
