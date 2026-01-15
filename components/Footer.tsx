import Link from "next/link";

const footerLinks = [
  { label: "Home", href: "/" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Blog", href: "/about" },
  { label: "Login", href: "/login" },
];

const resources = [
  { label: "Verified sources checklist", href: "/about" },
  { label: "Internship tracker guide", href: "/about" },
  { label: "Weekly digest sample", href: "/pricing" },
  { label: "Alert setup tips", href: "/alerts" },
];

const socials = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com",
    path: "M4 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm1.5 5.5H2.5v8h3v-8zm4.5 0H7.5v8h3v-4.2c0-1.2.7-2.1 1.8-2.1 1.1 0 1.7.8 1.7 2.2V16h3v-4.8c0-3-1.6-4.4-3.8-4.4-1.7 0-2.5.9-2.7 1.5h-.1V8.5z",
  },
  {
    label: "X",
    href: "https://x.com",
    path: "M4 4h3.5l3 4.3L14 4h3.2l-5.4 7.3L17.5 20H14l-3.2-4.7L6.8 20H3.6l5.7-7.6L4 4z",
  },
  {
    label: "GitHub",
    href: "https://github.com",
    path: "M10 2a8 8 0 0 0-2.5 15.6c.4.1.6-.2.6-.4v-1.4c-2.6.6-3.1-1.1-3.1-1.1-.4-1.1-1-1.4-1-1.4-.8-.6.1-.6.1-.6.9.1 1.4 1 1.4 1 .8 1.4 2.1 1 2.6.8.1-.6.3-1 .6-1.2-2.1-.2-4.3-1-4.3-4.6 0-1 .4-1.9 1-2.6-.1-.3-.4-1.2.1-2.4 0 0 .8-.2 2.6 1a9 9 0 0 1 4.8 0c1.8-1.2 2.6-1 2.6-1 .5 1.2.2 2.1.1 2.4.6.7 1 1.6 1 2.6 0 3.6-2.2 4.4-4.3 4.6.3.3.6.8.6 1.6v2.3c0 .2.2.5.6.4A8 8 0 0 0 10 2z",
  },
];

export function Footer() {
  return (
    <footer className="bg-[#0b1220] text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white">
              R
            </span>
            <span>Rezoomind</span>
          </div>
          <p className="text-sm text-white/70">Never miss a job again.</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/70">
            Quick Links
          </h3>
          <ul className="space-y-2 text-sm text-white/70">
            {footerLinks.map((link) => (
              <li key={link.label}>
                <Link
                  className="transition hover:text-brand"
                  href={link.href}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/70">
            Resources
          </h3>
          <ul className="space-y-2 text-sm text-white/70">
            {resources.map((resource) => (
              <li key={resource.label}>
                <Link
                  className="transition hover:text-brand"
                  href={resource.href}
                >
                  {resource.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-white/70">
            Newsletter
          </h3>
          <p className="text-sm text-white/60">
            Get a monthly roundup of verified internships.
          </p>
          <form className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="you@school.edu"
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/50 focus:border-[rgb(var(--brand-hover-rgb))] focus:outline-none"
            />
            <button
              type="button"
              className="rounded-2xl bg-[rgb(var(--brand-rgb))] px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-[rgb(var(--brand-hover-rgb))]"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 text-xs text-white/60 sm:flex-row">
          <span>© 2025 Rezoomind. All rights reserved.</span>
          <div className="flex items-center gap-4">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="transition hover:text-brand"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                  <path d={social.path} fill="currentColor" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
