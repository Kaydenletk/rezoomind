import { NextResponse } from "next/server";
import { z } from "zod";
import { getResumeAIService } from "@/lib/ai/resume-ai.service";
import { isAIServiceError } from "@/lib/ai/errors";

export const dynamic = "force-dynamic";

const isDev = process.env.NODE_ENV === "development";

const linkedinSchema = z.object({
  currentProfile: z
    .object({
      headline: z.string().optional(),
      summary: z.string().optional(),
      experience: z.string().optional(),
    })
    .optional()
    .default({}),
  resume: z.string().min(100, "Resume must be at least 100 characters"),
  targetRole: z.string().min(2, "Target role is required"),
  targetIndustry: z.string().min(2, "Target industry is required"),
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

    const validation = linkedinSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          error: validation.error.issues[0]?.message || "Invalid input",
        },
        { status: 400 }
      );
    }

    const { currentProfile, resume, targetRole, targetIndustry } =
      validation.data;

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      if (isDev) {
        console.warn(
          "[resume:linkedin] OPENAI_API_KEY not set, returning mock data"
        );
      }
      return NextResponse.json({
        ok: true,
        optimized_headline: {
          text: `${targetRole} | Full-Stack Developer | Building Scalable Solutions`,
          keywords: [targetRole, "Full-Stack", "Developer"],
          rationale:
            "Includes target role and key skills for better searchability",
        },
        optimized_summary: {
          text: `Passionate ${targetRole} with expertise in building scalable applications. Experienced in full-stack development with a focus on delivering high-quality solutions that drive business results.\n\nOpen to opportunities in ${targetIndustry}.`,
          structure: "Introduction, expertise, call to action",
          keywords: [targetRole, targetIndustry, "full-stack"],
          call_to_action: `Open to opportunities in ${targetIndustry}`,
        },
        experience_improvements: [
          {
            role: "Software Engineer",
            improved:
              "Led development of key features, improving performance by 40%",
            changes: ["Added metrics", "Strengthened action verbs"],
          },
        ],
        skills_to_add: [
          {
            skill: "React",
            priority: "high",
            reason: "Essential for modern frontend development",
          },
          {
            skill: "Node.js",
            priority: "high",
            reason: "Key backend technology",
          },
        ],
        profile_optimization_tips: [
          "Add a professional photo",
          "Request recommendations from colleagues",
          "Engage with industry content regularly",
        ],
        searchability_score: 75,
        meta: { mock: true },
      });
    }

    if (isDev) {
      console.log("[resume:linkedin] Processing request", {
        resumeLength: resume.length,
        targetRole,
        targetIndustry,
      });
    }

    const aiService = getResumeAIService();
    const result = await aiService.optimizeLinkedIn({
      currentProfile,
      resume,
      targetRole,
      targetIndustry,
    });

    if (isDev) {
      console.log("[resume:linkedin] Complete", {
        searchabilityScore: result.searchability_score,
      });
    }

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    if (isDev) {
      console.error("[resume:linkedin] failed", {
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
