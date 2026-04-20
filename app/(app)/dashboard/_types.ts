export interface JobPosting {
  id: string;
  role: string;
  company: string;
  location: string | null;
  url: string | null;
  tags: string[] | null;
  date_posted: string | null;
  created_at: string;
  description?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_interval?: string | null;
}

export interface JobMatchRow {
  match_score: number | null;
  match_reasons: string[] | null;
  is_saved: boolean | null;
  is_applied: boolean | null;
  job_postings: JobPosting | null;
  experience_match?: number | null;
  skills_match?: number | null;
  missing_skills?: string[] | null;
}
