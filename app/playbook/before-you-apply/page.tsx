import type { Metadata } from "next";
import { PlaybookArticle } from "@/components/playbook/PlaybookArticle";
import { PLAYBOOK_ARTICLES } from "@/content/playbook";

const article = PLAYBOOK_ARTICLES["before-you-apply"];

export const metadata: Metadata = {
  title: `${article.title} — The Playbook`,
  description: article.lede,
};

export default function Page() {
  return <PlaybookArticle article={article} />;
}
