export interface SmartFeedJob {
  id: string;
  company: string;
  role: string;
  location: string | null;
  url: string | null;
  datePosted: string | null;
  salary?: string | null;
  tags?: string[] | null;
  description?: string | null;
  category?: string;
}

export interface JobMatch {
  matchScore: number | null;
  skillsMatch?: number | null;
  experienceMatch?: number | null;
  matchReasons?: string[] | null;
  missingSkills?: string[] | null;
}
