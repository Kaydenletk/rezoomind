import { NextResponse } from "next/server";
import { getResumeAIService } from "@/lib/ai/resume-ai.service";
import { AIServiceError, isAIServiceError } from "@/lib/ai/errors";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const isDev = process.env.NODE_ENV === "development";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { ok: false, error: "Invalid request payload." },
        { status: 400 }
      );
    }

    const resumeText =
      typeof body.resumeText === "string" ? body.resumeText.trim() : "";
    const jobDescription =
      typeof body.jobDescription === "string" ? body.jobDescription.trim() : "";
    const fileName = typeof body.fileName === "string" ? body.fileName : "";
    const fileSize = typeof body.fileSize === "number" ? body.fileSize : 0;

    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { ok: false, error: "File too large. Max 2MB." },
        { status: 400 }
      );
    }

    if (!resumeText && !fileName) {
      return NextResponse.json(
        { ok: false, error: "Provide resume text or a file." },
        { status: 400 }
      );
    }

    if (resumeText.length < 100) {
      return NextResponse.json(
        { ok: false, error: "Resume text is too short. Please provide more content." },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      if (isDev) {
        console.warn("[resume:analyze] OPENAI_API_KEY not set, returning mock data");
      }
      // Return mock data if API key is not configured
      return NextResponse.json({
        ok: true,
        score: 78,
        strengths: [
          "Clear impact metrics on projects",
          "Relevant tooling for modern SWE internships",
        ],
        gaps: [
          "Add more collaboration outcomes",
          "Highlight cloud or deployment exposure",
        ],
        bulletSuggestions: [
          "Built a scalable API that reduced response latency by 32% using Node.js and Redis.",
          "Led a 4-person sprint to ship a React dashboard, improving activation by 18%.",
          "Automated data validation workflows in Python, saving 6 hours per week.",
        ],
        keywords: ["TypeScript", "React", "Node", "SQL", "CI/CD"],
        meta: {
          jobDescriptionProvided: Boolean(jobDescription),
          mock: true,
        },
      });
    }

    if (isDev) {
      console.log("[resume:analyze] Processing request", {
        resumeLength: resumeText.length,
        hasJobDescription: Boolean(jobDescription),
      });
    }

    const aiService = getResumeAIService();
    const analysis = await aiService.analyzeResume(
      resumeText,
      jobDescription || undefined
    );

    // Map the rich AI response to the expected UI format
    const result = {
      ok: true,
      score: analysis.overall_score,
      strengths: analysis.strengths.slice(0, 5),
      gaps: analysis.critical_issues
        .filter((issue) => issue.severity === "high" || issue.severity === "medium")
        .slice(0, 5)
        .map((issue) => issue.fix),
      bulletSuggestions: analysis.improvement_opportunities
        .filter((opp) => opp.category === "quantification" || opp.category === "action_verbs")
        .slice(0, 5)
        .flatMap((opp) => opp.examples)
        .slice(0, 5),
      keywords: analysis.ats_analysis.missing_sections
        .concat(
          analysis.improvement_opportunities
            .filter((opp) => opp.category === "keywords")
            .flatMap((opp) => opp.examples)
        )
        .slice(0, 10),
      meta: {
        jobDescriptionProvided: Boolean(jobDescription),
        sectionScores: analysis.section_scores,
        atsScore: analysis.ats_analysis.score,
      },
      // Include full analysis for advanced UI features
      fullAnalysis: analysis,
    };

    if (isDev) {
      console.log("[resume:analyze] Analysis complete", {
        score: result.score,
        strengthsCount: result.strengths.length,
        gapsCount: result.gaps.length,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    if (isDev) {
      console.error("[resume:analyze] failed", {
        message: error instanceof Error ? error.message : "unknown",
        stack: error instanceof Error ? error.stack : undefined,
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
