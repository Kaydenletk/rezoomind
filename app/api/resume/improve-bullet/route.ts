import { NextResponse } from "next/server";
import { z } from "zod";
import { getResumeAIService } from "@/lib/ai/resume-ai.service";
import { isAIServiceError } from "@/lib/ai/errors";
import type { ImprovementMode } from "@/types/ai";

export const dynamic = "force-dynamic";

const isDev = process.env.NODE_ENV === "development";

const bulletSchema = z.object({
  bulletPoint: z.string().min(10, "Bullet point must be at least 10 characters"),
  context: z
    .object({
      role: z.string().min(1, "Role is required"),
      company: z.string().min(1, "Company is required"),
      industry: z.string().min(1, "Industry is required"),
    })
    .optional()
    .default({
      role: "Professional",
      company: "Company",
      industry: "Technology",
    }),
  mode: z
    .enum(["aggressive", "balanced", "conservative"])
    .optional()
    .default("balanced"),
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

    const validation = bulletSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          error: validation.error.issues[0]?.message || "Invalid input",
        },
        { status: 400 }
      );
    }

    const { bulletPoint, context, mode } = validation.data;

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      if (isDev) {
        console.warn(
          "[resume:improve-bullet] OPENAI_API_KEY not set, returning mock data"
        );
      }
      return NextResponse.json({
        ok: true,
        improved_versions: [
          {
            text: `Developed and delivered ${bulletPoint.split(" ").slice(0, 3).join(" ")}... achieving 40% improvement in key metrics`,
            changes_made: ["Added quantification", "Strengthened action verb"],
            metrics_added: ["40% improvement"],
            reasoning: "Added specific metrics and stronger action verb",
          },
        ],
        metrics_guidance:
          "Consider adding specific numbers like team size, project scope, or performance improvements",
        action_verb_upgrade: "Original verb → Developed",
        meta: { mock: true },
      });
    }

    if (isDev) {
      console.log("[resume:improve-bullet] Processing request", {
        bulletLength: bulletPoint.length,
        mode,
      });
    }

    const aiService = getResumeAIService();
    const result = await aiService.improveBullet(
      bulletPoint,
      context,
      mode as ImprovementMode
    );

    if (isDev) {
      console.log("[resume:improve-bullet] Complete", {
        versionsCount: result.improved_versions.length,
      });
    }

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    if (isDev) {
      console.error("[resume:improve-bullet] failed", {
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
