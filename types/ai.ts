// ============================================
// Resume Analysis Types
// ============================================

export interface CriticalIssue {
  issue: string;
  severity: "high" | "medium" | "low";
  location: string;
  example: string;
  fix: string;
  impact: string;
}

export interface ImprovementOpportunity {
  category:
    | "action_verbs"
    | "quantification"
    | "keywords"
    | "formatting"
    | "length"
    | "structure";
  description: string;
  examples: string[];
  priority: "high" | "medium" | "low";
}

export interface ATSAnalysis {
  score: number;
  keyword_optimization: string;
  formatting_issues: string[];
  missing_sections: string[];
  file_compatibility: string;
}

export interface Recommendation {
  title: string;
  description: string;
  priority: "critical" | "important" | "nice-to-have";
  estimated_impact: "high" | "medium" | "low";
}

export interface ResumeAnalysisResult {
  overall_score: number;
  section_scores: {
    formatting: number;
    content_quality: number;
    ats_compatibility: number;
    impact: number;
    clarity: number;
  };
  strengths: string[];
  critical_issues: CriticalIssue[];
  improvement_opportunities: ImprovementOpportunity[];
  ats_analysis: ATSAnalysis;
  recommendations: Recommendation[];
  next_steps: string[];
}

// ============================================
// Bullet Improvement Types
// ============================================

export type ImprovementMode = "aggressive" | "balanced" | "conservative";

export interface BulletContext {
  role: string;
  company: string;
  industry: string;
}

export interface ImprovedBulletVersion {
  text: string;
  changes_made: string[];
  metrics_added: string[];
  reasoning: string;
}

export interface BulletImprovementResult {
  improved_versions: ImprovedBulletVersion[];
  metrics_guidance: string;
  action_verb_upgrade: string;
}

// ============================================
// ATS Optimization Types
// ============================================

export interface MatchedKeyword {
  keyword: string;
  found_in_resume: boolean;
  importance: "critical" | "important" | "nice-to-have";
  location: string | null;
}

export interface MissingKeyword {
  keyword: string;
  why_important: string;
  where_to_add: string;
  example: string;
}

export interface FormattingIssue {
  issue: string;
  why_problematic: string;
  fix: string;
}

export interface SectionRecommendation {
  section: string;
  current_state: string;
  recommendation: string;
  ats_impact: string;
}

export interface ATSOptimizationResult {
  ats_score: number;
  keyword_analysis: {
    matched_keywords: MatchedKeyword[];
    missing_critical_keywords: MissingKeyword[];
    keyword_stuffing_risk: string;
  };
  formatting_issues: FormattingIssue[];
  section_recommendations: SectionRecommendation[];
  optimized_sections: {
    skills: string;
    summary: string;
  };
  priority_actions: string[];
}

// ============================================
// Cover Letter Types
// ============================================

export type CoverLetterTone =
  | "professional"
  | "enthusiastic"
  | "creative"
  | "technical";

export interface CoverLetterParams {
  resumeText: string;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  companyInfo?: string;
  tone: CoverLetterTone;
  specificReason?: string;
}

export interface CoverLetterResult {
  cover_letter: string;
  key_points: string[];
  matched_requirements: {
    requirement: string;
    how_addressed: string;
  }[];
  call_to_action: string;
  personalization_elements: string[];
}

// ============================================
// LinkedIn Optimization Types
// ============================================

export interface LinkedInExperience {
  title: string;
  company: string;
  description?: string;
  duration?: string;
}

export interface LinkedInProfileData {
  currentProfile: {
    headline?: string;
    summary?: string;
    experience?: string;
  };
  resume: string;
  targetRole: string;
  targetIndustry: string;
}

export interface ExperienceImprovement {
  role: string;
  current?: string;
  improved: string;
  changes: string[];
}

export interface LinkedInOptimizationResult {
  optimized_headline: {
    text: string;
    keywords: string[];
    rationale: string;
  };
  optimized_summary: {
    text: string;
    structure: string;
    keywords: string[];
    call_to_action: string;
  };
  experience_improvements: ExperienceImprovement[];
  skills_to_add: {
    skill: string;
    priority: "high" | "medium" | "low";
    reason: string;
  }[];
  profile_optimization_tips: string[];
  searchability_score: number;
}

// ============================================
// Error Types
// ============================================

export type AIErrorCode =
  | "RATE_LIMIT"
  | "INVALID_INPUT"
  | "API_ERROR"
  | "PARSE_ERROR"
  | "UNAUTHORIZED"
  | "MISSING_API_KEY";

export interface AIServiceErrorData {
  code: AIErrorCode;
  message: string;
  statusCode: number;
  retryAfter?: number;
}
