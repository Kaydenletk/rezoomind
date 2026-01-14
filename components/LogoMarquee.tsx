const logos = [
  { name: "Stripe", file: "/logos/stripe.svg" },
  { name: "Notion", file: "/logos/notion.svg" },
  { name: "Airbnb", file: "/logos/airbnb.svg" },
  { name: "NVIDIA", file: "/logos/nvidia.svg" },
  { name: "TikTok", file: "/logos/tiktok.svg" },
  { name: "Uber", file: "/logos/uber.svg" },
  { name: "Shopify", file: "/logos/shopify.svg" },
  { name: "Coinbase", file: "/logos/coinbase.svg" },
  { name: "DoorDash", file: "/logos/doordash.svg" },
  { name: "Reddit", file: "/logos/reddit.svg" },
  { name: "Google", file: "/logos/google.svg" },
  { name: "Meta", file: "/logos/meta.svg" },
  { name: "Netflix", file: "/logos/netflix.svg" },
  { name: "Intel", file: "/logos/intel.svg" },
  { name: "AMD", file: "/logos/amd.svg" },
  { name: "Apple", file: "/logos/apple.svg" },
  { name: "Tesla", file: "/logos/tesla.svg" },
  { name: "Databricks", file: "/logos/databricks.svg" },
];

const logoTiles = [...logos, ...logos];

export function LogoMarquee() {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
        Trusted by teams at
      </p>
      <div className="logo-marquee relative mt-6">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white via-white/70 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white via-white/70 to-transparent" />
        <div className="logo-track">
          {logoTiles.map((logo, index) => (
            <div
              key={`${logo.name}-${index}`}
              className="flex h-14 min-w-[140px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 shadow-sm transition hover:border-[rgba(var(--brand-rgb),0.5)] hover:shadow-[0_12px_30px_var(--brand-glow)]"
            >
              <img
                src={logo.file}
                alt={logo.name}
                loading="lazy"
                className="h-7 w-auto max-w-[140px] opacity-80"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
