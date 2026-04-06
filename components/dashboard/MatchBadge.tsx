interface MatchBadgeProps {
  score: number; // 0-100
}

export function MatchBadge({ score }: MatchBadgeProps) {
  const color =
    score >= 75
      ? "text-orange-500 border-orange-500/40 bg-orange-500/10"
      : score >= 50
        ? "text-amber-500 border-amber-500/40 bg-amber-500/10"
        : "text-stone-400 border-stone-400/30 bg-stone-400/10";

  return (
    <span
      className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${color}`}
      title={`${score}% match`}
    >
      {score}%
    </span>
  );
}
