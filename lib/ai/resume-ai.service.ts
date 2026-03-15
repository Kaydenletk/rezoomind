import {
  GEMINI_GENERATIVE_MODEL,
  generateGeminiJson,
} from "./client";
import { AIServiceError } from "./errors";
import {
  ANALYZE_SYSTEM_PROMPT,
  getAnalyzeUserPrompt,
} from "./prompts/analyze";
import {
  BULLET_IMPROVE_SYSTEM_PROMPT,
  getBulletImproveUserPrompt,
} from "./prompts/bullet-improve";
import {
  ATS_OPTIMIZE_SYSTEM_PROMPT,
  getATSOptimizeUserPrompt,
} from "./prompts/ats-optimize";
import {
  COVER_LETTER_SYSTEM_PROMPT,
  getCoverLetterUserPrompt,
} from "./prompts/cover-letter";
import {
  LINKEDIN_SYSTEM_PROMPT,
  getLinkedInUserPrompt,
} from "./prompts/linkedin";
import type {
  ResumeAnalysisResult,
  BulletContext,
  ImprovementMode,
  BulletImprovementResult,
  ATSOptimizationResult,
  CoverLetterParams,
  CoverLetterResult,
  LinkedInProfileData,
  LinkedInOptimizationResult,
} from "@/types/ai";

const DEFAULT_MODEL = GEMINI_GENERATIVE_MODEL;
const DEFAULT_MAX_TOKENS = 4096;

export class ResumeAIService {
  private model: string;
  private maxTokens: number;

  constructor(options?: { model?: string; maxTokens?: number }) {
    this.model = options?.model ?? DEFAULT_MODEL;
    this.maxTokens = options?.maxTokens ?? DEFAULT_MAX_TOKENS;
  }

  private async callGemini<T>(
    systemPrompt: string,
    userPrompt: string
  ): Promise<T> {
    try {
      return await generateGeminiJson<T>({
        systemPrompt,
        prompt: userPrompt,
        model: this.model,
        maxOutputTokens: this.maxTokens,
      });
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : "Gemini service unavailable";

      if (
        message.toLowerCase().includes("quota") ||
        message.toLowerCase().includes("rate limit") ||
        message.includes("RESOURCE_EXHAUSTED")
      ) {
        throw new AIServiceError(
          "RATE_LIMIT",
          "Too many requests. Please try again later.",
          429,
          60
        );
      }

      if (
        message.toLowerCase().includes("api key") ||
        message.toLowerCase().includes("permission denied") ||
        message.includes("API_KEY_INVALID")
      ) {
        throw new AIServiceError(
          "UNAUTHORIZED",
          "Invalid Gemini API key",
          401
        );
      }

      if (
        message.toLowerCase().includes("json") ||
        message.toLowerCase().includes("parse")
      ) {
        throw new AIServiceError(
          "PARSE_ERROR",
          "Failed to parse AI response as JSON",
          500
        );
      }

      throw new AIServiceError(
        "API_ERROR",
        message,
        502
      );
    }
  }

  /**
   * Analyze resume and provide comprehensive feedback
   */
  async analyzeResume(
    resumeText: string,
    targetRole?: string
  ): Promise<ResumeAnalysisResult> {
    if (!resumeText || resumeText.trim().length < 100) {
      throw new AIServiceError(
        "INVALID_INPUT",
        "Resume text is too short. Please provide more content.",
        400
      );
    }

    const systemPrompt = ANALYZE_SYSTEM_PROMPT;
    const userPrompt = getAnalyzeUserPrompt(resumeText, targetRole);

    return this.callGemini<ResumeAnalysisResult>(systemPrompt, userPrompt);
  }

  /**
   * Improve specific bullet points
   */
  async improveBullet(
    bullet: string,
    context: BulletContext,
    mode: ImprovementMode = "balanced"
  ): Promise<BulletImprovementResult> {
    if (!bullet || bullet.trim().length < 10) {
      throw new AIServiceError(
        "INVALID_INPUT",
        "Bullet point is too short to improve.",
        400
      );
    }

    const systemPrompt = BULLET_IMPROVE_SYSTEM_PROMPT;
    const userPrompt = getBulletImproveUserPrompt(bullet, context, mode);

    return this.callGemini<BulletImprovementResult>(systemPrompt, userPrompt);
  }

  /**
   * Optimize resume for ATS
   */
  async optimizeForATS(
    resumeText: string,
    jobDescription: string
  ): Promise<ATSOptimizationResult> {
    if (!resumeText || resumeText.trim().length < 100) {
      throw new AIServiceError(
        "INVALID_INPUT",
        "Resume text is too short.",
        400
      );
    }

    if (!jobDescription || jobDescription.trim().length < 50) {
      throw new AIServiceError(
        "INVALID_INPUT",
        "Job description is required for ATS optimization.",
        400
      );
    }

    const systemPrompt = ATS_OPTIMIZE_SYSTEM_PROMPT;
    const userPrompt = getATSOptimizeUserPrompt(resumeText, jobDescription);

    return this.callGemini<ATSOptimizationResult>(systemPrompt, userPrompt);
  }

  /**
   * Generate cover letter
   */
  async generateCoverLetter(
    params: CoverLetterParams
  ): Promise<CoverLetterResult> {
    if (!params.resumeText || params.resumeText.trim().length < 100) {
      throw new AIServiceError(
        "INVALID_INPUT",
        "Resume text is too short.",
        400
      );
    }

    if (!params.jobDescription || params.jobDescription.trim().length < 50) {
      throw new AIServiceError(
        "INVALID_INPUT",
        "Job description is required.",
        400
      );
    }

    if (!params.companyName || params.companyName.trim().length < 1) {
      throw new AIServiceError(
        "INVALID_INPUT",
        "Company name is required.",
        400
      );
    }

    const systemPrompt = COVER_LETTER_SYSTEM_PROMPT;
    const userPrompt = getCoverLetterUserPrompt(params);

    return this.callGemini<CoverLetterResult>(systemPrompt, userPrompt);
  }

  /**
   * Optimize LinkedIn profile
   */
  async optimizeLinkedIn(
    params: LinkedInProfileData
  ): Promise<LinkedInOptimizationResult> {
    if (!params.resume || params.resume.trim().length < 100) {
      throw new AIServiceError(
        "INVALID_INPUT",
        "Resume text is required to optimize LinkedIn profile.",
        400
      );
    }

    if (!params.targetRole || params.targetRole.trim().length < 2) {
      throw new AIServiceError(
        "INVALID_INPUT",
        "Target role is required.",
        400
      );
    }

    const systemPrompt = LINKEDIN_SYSTEM_PROMPT;
    const userPrompt = getLinkedInUserPrompt(params);

    return this.callGemini<LinkedInOptimizationResult>(systemPrompt, userPrompt);
  }
}

// Export singleton instance
let resumeAIInstance: ResumeAIService | null = null;

export function getResumeAIService(): ResumeAIService {
  if (!resumeAIInstance) {
    resumeAIInstance = new ResumeAIService();
  }
  return resumeAIInstance;
}
