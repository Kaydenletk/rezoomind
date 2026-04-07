import { NextResponse } from "next/server";
import { generateGeminiJson, hasGeminiKey } from "@/lib/ai/client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || !body.jobDescription || !body.resumeText) {
      return NextResponse.json(
        { success: false, error: "Missing jobDescription or resumeText" },
        { status: 400 }
      );
    }

    const { jobDescription, resumeText } = body;

    if (!hasGeminiKey()) {
      // Mock response if no API key is provided
      return NextResponse.json({
        success: true,
        result: {
          matchScore: 82,
          matchedKeywords: ["React", "Typescript", "Node.js", "Git"],
          missingKeywords: ["Docker", "Kubernetes", "AWS"],
          suggestions: [
            "Add your experience deploying Node apps using Docker.",
            "Quantify the impact of your React rewrite (e.g., 'saved 2 hours of load time').",
            "Mention any AWS services used in your junior dev project.",
          ]
        }
      });
    }

    const prompt = `You are an expert ATS System and Resume Tailor.
Given the following Job Description and the Candidate's Resume, provide an ATS analysis. 
You must return only JSON matching this structure:
{
  "matchScore": number (0-100),
  "matchedKeywords": string[],
  "missingKeywords": string[],
  "suggestions": string[] // 3 highly actionable bullet point tweaks or tips to boost match rate
}

Job Description:
${jobDescription}

Candidate Resume:
${resumeText}`;

    const result = await generateGeminiJson({
      prompt,
      systemPrompt: "You are an expert Resume Tailor. Always return valid JSON matching the requested structure.",
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("[quick-tailor] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
