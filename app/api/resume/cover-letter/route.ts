import { NextResponse } from "next/server";
import { z } from "zod";
import { getResumeAIService } from "@/lib/ai/resume-ai.service";
import { isAIServiceError } from "@/lib/ai/errors";
import type { CoverLetterTone } from "@/types/ai";

export const dynamic = "force-dynamic";

const isDev = process.env.NODE_ENV === "development";

const coverLetterSchema = z.object({
  resumeText: z.string().min(100, "Resume must be at least 100 characters"),
  jobTitle: z.string().min(1, "Job title is required"),
  companyName: z.string().min(1, "Company name is required"),
  jobDescription: z
    .string()
    .min(50, "Job description must be at least 50 characters"),
  companyInfo: z.string().optional(),
  tone: z
    .enum(["professional", "enthusiastic", "creative", "technical"])
    .optional()
    .default("professional"),
  specificReason: z.string().optional(),
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

    const validation = coverLetterSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          ok: false,
          error: validation.error.issues[0]?.message || "Invalid input",
        },
        { status: 400 }
      );
    }

    const {
      resumeText,
      jobTitle,
      companyName,
      jobDescription,
      companyInfo,
      tone,
      specificReason,
    } = validation.data;

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      if (isDev) {
        console.warn(
          "[resume:cover-letter] OPENAI_API_KEY not set, returning mock data"
        );
      }
      return NextResponse.json({
        ok: true,
        cover_letter: `Dear Hiring Manager,

I am excited to apply for the ${jobTitle} position at ${companyName}. With my background in software development and passion for building impactful products, I believe I would be a great addition to your team.

Throughout my career, I have developed strong skills in full-stack development, working with technologies like React, Node.js, and Python. I am particularly drawn to ${companyName}'s mission and would love the opportunity to contribute to your continued success.

I would welcome the chance to discuss how my skills and experience align with your needs. Thank you for considering my application.

Best regards`,
        key_points: [
          "Expressed enthusiasm for the role",
          "Highlighted relevant technical skills",
          "Connected with company mission",
        ],
        matched_requirements: [
          {
            requirement: "Full-stack development experience",
            how_addressed: "Mentioned React, Node.js, and Python expertise",
          },
        ],
        call_to_action: "Requested opportunity to discuss further",
        personalization_elements: [
          "Referenced company name",
          "Mentioned specific job title",
        ],
        meta: { mock: true },
      });
    }

    if (isDev) {
      console.log("[resume:cover-letter] Processing request", {
        resumeLength: resumeText.length,
        jobTitle,
        companyName,
        tone,
      });
    }

    const aiService = getResumeAIService();
    const result = await aiService.generateCoverLetter({
      resumeText,
      jobTitle,
      companyName,
      jobDescription,
      companyInfo,
      tone: tone as CoverLetterTone,
      specificReason,
    });

    if (isDev) {
      console.log("[resume:cover-letter] Complete", {
        letterLength: result.cover_letter.length,
        keyPointsCount: result.key_points.length,
      });
    }

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    if (isDev) {
      console.error("[resume:cover-letter] failed", {
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
