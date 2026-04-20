'use client';

export function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-mono font-medium transition ${
        active
          ? 'bg-orange-600/10 text-orange-600 dark:text-orange-400 border border-orange-600'
          : 'border border-line bg-surface-sunken/60 text-fg-muted hover:border-line hover:text-fg'
      }`}
    >
      {label}
    </button>
  );
}
