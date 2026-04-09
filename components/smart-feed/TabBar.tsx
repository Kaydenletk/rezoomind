"use client";

export type TabId = "for-you" | "all-jobs" | "saved" | "applied" | "tracking";

interface Tab {
  id: TabId;
  label: string;
  count?: number;
}

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  tabs: Tab[];
}

export function TabBar({ activeTab, onTabChange, tabs }: TabBarProps) {
  return (
    <div
      className={[
        "flex gap-0 border-b border-stone-200 dark:border-stone-800",
        "px-5 bg-white dark:bg-stone-900/50",
        "overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]",
      ].join(" ")}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={[
              "px-4 py-2.5 font-mono text-xs uppercase tracking-wider cursor-pointer transition-colors shrink-0",
              isActive
                ? "text-orange-600 dark:text-orange-500 border-b-2 border-orange-600 dark:border-orange-500 -mb-px"
                : "text-stone-500 hover:text-stone-700 dark:hover:text-stone-300",
            ].join(" ")}
            aria-selected={isActive}
            role="tab"
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-[10px] bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 px-1.5 py-0.5 rounded-sm font-mono inline-block">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
