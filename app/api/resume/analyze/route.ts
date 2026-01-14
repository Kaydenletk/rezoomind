import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { ok: false, error: "Invalid request payload." },
        { status: 400 }
      );
    }

    const resumeText = typeof body.resumeText === "string" ? body.resumeText.trim() : "";
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

    const result = {
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
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[resume:analyze] failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
