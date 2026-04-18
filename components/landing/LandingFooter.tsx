import Link from "next/link";
import { formatTimeAgo } from "@/lib/format-time";
import { LANDING_COPY } from "./copy";

interface LandingFooterProps {
  lastSynced: string;
}

export function LandingFooter({ lastSynced }: LandingFooterProps) {
  const ago = formatTimeAgo(lastSynced);
  const line = LANDING_COPY.footer.line(ago);
  const [prefix, privacy, terms] = line.split(" · privacy · terms");

  return (
    <footer className="max-w-[980px] mx-auto px-4 sm:px-7 mt-14 mb-10">
      <div className="border-t border-line-subtle pt-6 flex flex-wrap items-center gap-3 justify-between font-mono text-label text-fg-subtle">
        <span>{prefix || line}</span>
        <span className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-fg-muted transition-colors">
            privacy
          </Link>
          <Link href="/terms" className="hover:text-fg-muted transition-colors">
            terms
          </Link>
        </span>
      </div>
    </footer>
  );
}
