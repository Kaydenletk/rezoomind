const sparkOffsets = [
  { x: 264, y: 92, delay: "0s" },
  { x: 286, y: 128, delay: "0.2s" },
  { x: 250, y: 150, delay: "0.4s" },
];

export function HeroMascot() {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
        <span className="relative inline-flex h-2.5 w-2.5">
          <span className="mascot-live-ping absolute inline-flex h-full w-full rounded-full" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[rgb(var(--brand-rgb))] shadow-[0_0_12px_var(--brand-glow)]" />
        </span>
        Live delivery
      </div>

      <div className="w-full">
        <svg
          viewBox="0 0 320 250"
          className="h-auto w-full"
          aria-hidden="true"
        >
          <ellipse
            className="mascot-shadow"
            cx="160"
            cy="226"
            rx="82"
            ry="16"
            fill="rgba(15, 23, 42, 0.08)"
          />

          <g className="mascot-float">
            <line
              x1="160"
              y1="22"
              x2="160"
              y2="40"
              stroke="#CBD5F5"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="160" cy="18" r="6" fill="rgb(var(--brand-rgb))" />

            <rect
              x="110"
              y="46"
              width="100"
              height="68"
              rx="28"
              fill="#FFFFFF"
              stroke="#E2E8F0"
              strokeWidth="2"
            />
            <circle cx="145" cy="78" r="4" fill="#94A3B8" />
            <circle cx="175" cy="78" r="4" fill="#94A3B8" />
            <path
              d="M150 94c6 6 14 6 20 0"
              stroke="#94A3B8"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />

            <rect
              x="90"
              y="102"
              width="140"
              height="96"
              rx="34"
              fill="#F8FAFC"
              stroke="#E2E8F0"
              strokeWidth="2"
            />
            <rect
              x="112"
              y="132"
              width="96"
              height="10"
              rx="5"
              fill="#E2E8F0"
            />

            <rect
              x="210"
              y="132"
              width="36"
              height="16"
              rx="8"
              fill="#E2E8F0"
            />

            <g className="mascot-envelope">
              <rect
                x="232"
                y="112"
                width="68"
                height="46"
                rx="12"
                fill="rgb(var(--brand-rgb))"
              />
              <path
                d="M232 118l34 24 34-24"
                stroke="rgba(15, 23, 42, 0.35)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <rect
                x="238"
                y="118"
                width="56"
                height="34"
                rx="8"
                fill="rgba(255, 255, 255, 0.5)"
              />
            </g>

            {sparkOffsets.map((spark) => (
              <rect
                key={`${spark.x}-${spark.y}`}
                className="mascot-spark"
                x={spark.x}
                y={spark.y}
                width="8"
                height="8"
                rx="2"
                transform={`rotate(45 ${spark.x + 4} ${spark.y + 4})`}
                fill="rgb(var(--brand-rgb))"
                style={{ animationDelay: spark.delay }}
              />
            ))}

            <line
              x1="262"
              y1="104"
              x2="284"
              y2="92"
              stroke="rgba(102, 227, 249, 0.7)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="256"
              y1="168"
              x2="276"
              y2="178"
              stroke="rgba(102, 227, 249, 0.7)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}
