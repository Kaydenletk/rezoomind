import type { SupabaseClient } from "@supabase/supabase-js";
import { buildJobKeywords } from "@/lib/matching/keywords";

type InternshipRow = {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  url: string | null;
  tags: string[] | null;
  created_at: string;
};

const chunkArray = <T,>(items: T[], size: number) => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

export async function ensureInternshipsInJobPostings(
  supabase: SupabaseClient
): Promise<{ inserted: number; total: number }> {
  const { data: internships } = await supabase
    .from("internships")
    .select("id,title,company,location,url,tags,created_at");

  const records = (internships ?? []) as InternshipRow[];
  if (records.length === 0) {
    return { inserted: 0, total: 0 };
  }

  const sourceIds = records.map((row) => `internships|${row.id}`);
  const existingIds = new Set<string>();

  for (const chunk of chunkArray(sourceIds, 100)) {
    const { data: existing } = await supabase
      .from("job_postings")
      .select("source_id")
      .in("source_id", chunk);
    existing?.forEach((row) => existingIds.add(row.source_id));
  }

  const missing = records.filter((row) => !existingIds.has(`internships|${row.id}`));
  if (missing.length === 0) {
    return { inserted: 0, total: records.length };
  }

  let inserted = 0;
  for (const chunk of chunkArray(missing, 50)) {
    const payload = chunk.map((row) => {
      const company = row.company?.trim() || "Unknown company";
      const role = row.title?.trim() || "Internship";
      const jobKeywords = buildJobKeywords({
        role,
        company,
        location: row.location,
        tags: row.tags ?? [],
        description: null,
      });

      return {
        source_id: `internships|${row.id}`,
        company,
        role,
        location: row.location,
        url: row.url,
        description: null,
        job_keywords: jobKeywords,
        description_fetched_at: null,
        date_posted: row.created_at,
        source: "internships",
        tags: row.tags ?? [],
        salary_min: null,
        salary_max: null,
        salary_interval: null,
        created_at: row.created_at,
      };
    });

    const { error } = await supabase.from("job_postings").insert(payload);
    if (!error) {
      inserted += chunk.length;
    }
  }

  return { inserted, total: records.length };
}
