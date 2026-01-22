import { NextResponse } from "next/server";
import { z } from "zod";
import { getResumeAIService } from "@/lib/ai/resume-ai.service";
import { isAIServiceError } from "@/lib/ai/errors";

export const dynamic = "force-dynamic";

const isDev = process.env.NODE_ENV === "development";

const atsSchema = z.object({
  resumeText: z.string().min(100, "Resume must be at least 100 characters"),
  jobDescription: z
    .string()
    .min(50, "Job description must be at least 50 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { ok: false, error: "Invalid request payload." },
        { status: 400 }
      );
    }

    const validation = atsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          error: validation.error.issues[0]?.message || "Invalid input",
        },
        { status: 400 }
      );
    }

    const { resumeText, jobDescription } = validation.data;

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      if (isDev) {
        console.warn(
          "[resume:ats-optimize] OPENAI_API_KEY not set, returning mock data"
        );
      }
      return NextResponse.json({
        ok: true,
        ats_score: 72,
        keyword_analysis: {
          matched_keywords: [
            {
              keyword: "JavaScript",
              found_in_resume: true,
              importance: "critical",
              location: "Skills section",
            },
          ],
          missing_critical_keywords: [
            {
              keyword: "TypeScript",
              why_important: "Required skill mentioned in job description",
              where_to_add: "Skills section",
              example: "Add 'TypeScript' to your technical skills",
            },
          ],
          keyword_stuffing_risk: "Low",
        },
        formatting_issues: [
          {
            issue: "Consider using standard section headers",
            why_problematic: "ATS may not recognize custom headers",
            fix: "Use 'Experience' instead of 'Work History'",
          },
        ],
        section_recommendations: [],
        optimized_sections: {
          skills:
            "JavaScript, TypeScript, React, Node.js, Python, SQL, Git, AWS",
          summary:
            "Experienced software engineer with expertise in full-stack development",
        },
        priority_actions: [
          "Add missing keywords from job description",
          "Use standard section headers",
        ],
        meta: { mock: true },
      });
    }

    if (isDev) {
      console.log("[resume:ats-optimize] Processing request", {
        resumeLength: resumeText.length,
        jobDescLength: jobDescription.length,
      });
    }

    const aiService = getResumeAIService();
    const result = await aiService.optimizeForATS(resumeText, jobDescription);

    if (isDev) {
      console.log("[resume:ats-optimize] Complete", {
        atsScore: result.ats_score,
      });
    }

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    if (isDev) {
      console.error("[resume:ats-optimize] failed", {
        message: error instanceof Error ? error.message : "unknown",
      });
    }

    if (isAIServiceError(error)) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
