import type { Metadata } from "next";
import { PlaybookStubPage } from "@/components/playbook/PlaybookStubPage";
import { LANDING_COPY } from "@/components/landing/copy";

const LABEL = LANDING_COPY.playbook.cards.beforeYouApply.label;

export const metadata: Metadata = {
  title: `${LABEL} — The Playbook`,
  description: LANDING_COPY.playbook.comingSoon.body,
};

export default function Page() {
  return <PlaybookStubPage label={LABEL} />;
}
