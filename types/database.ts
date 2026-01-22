// Database types for Supabase tables

export interface Profile {
  id: string;
  email: string | null;
  created_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  resume_text: string | null;
  file_url: string | null;
  title: string;
  improved_text: string | null;
  score: number | null;
  analysis: ResumeAnalysis | null;
  target_role: string | null;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResumeAnalysis {
  overall_score: number;
  section_scores: {
    formatting: number;
    content_quality: number;
    ats_compatibility: number;
    impact: number;
    clarity: number;
  };
  strengths: string[];
  critical_issues: Array<{
    issue: string;
    severity: "high" | "medium" | "low";
    location: string;
    example: string;
    fix: string;
    impact: string;
  }>;
  improvement_opportunities: Array<{
    category: string;
    description: string;
    examples: string[];
    priority: "high" | "medium" | "low";
  }>;
  ats_analysis: {
    score: number;
    keyword_optimization: string;
    formatting_issues: string[];
    missing_sections: string[];
    file_compatibility: string;
  };
  recommendations: Array<{
    title: string;
    description: string;
    priority: "critical" | "important" | "nice-to-have";
    estimated_impact: "high" | "medium" | "low";
  }>;
  next_steps: string[];
}

export interface CoverLetter {
  id: string;
  user_id: string;
  resume_id: string | null;
  job_title: string;
  company_name: string;
  job_description: string | null;
  generated_letter: string;
  tone: "professional" | "enthusiastic" | "creative" | "technical";
  created_at: string;
}

export interface UsageLog {
  id: string;
  user_id: string;
  action_type: string;
  credits_used: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ResumeImprovement {
  id: string;
  resume_id: string;
  section: string;
  before_text: string;
  after_text: string;
  improvement_type: string;
  ai_reasoning: string | null;
  accepted: boolean | null;
  created_at: string;
}

export interface Interest {
  id: string;
  user_id: string;
  roles: string[] | null;
  locations: string[] | null;
  keywords: string[] | null;
  grad_year: number | null;
  created_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  enabled: boolean;
  frequency: "daily" | "weekly";
  created_at: string;
}

export interface Internship {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  url: string | null;
  tags: string[] | null;
  created_at: string;
}

// Insert types (for creating new records)
export type ResumeInsert = Omit<Resume, "id" | "created_at" | "updated_at">;
export type CoverLetterInsert = Omit<CoverLetter, "id" | "created_at">;
export type UsageLogInsert = Omit<UsageLog, "id" | "created_at">;
export type ResumeImprovementInsert = Omit<ResumeImprovement, "id" | "created_at">;

// Update types (for updating existing records)
export type ResumeUpdate = Partial<Omit<Resume, "id" | "user_id" | "created_at">>;
export type CoverLetterUpdate = Partial<Omit<CoverLetter, "id" | "user_id" | "created_at">>;
