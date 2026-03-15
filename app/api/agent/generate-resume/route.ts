import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import * as cheerio from "cheerio";
import {
     generateGeminiText,
     hasGeminiKey,
} from "@/lib/ai/client";

export const maxDuration = 120; // Allow 2 minutes for LLM generation

export async function POST(request: Request) {
     try {
          const session = await getServerSession(authOptions);
          if (!session?.user?.id) {
               return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          }

          const { jobUrl } = await request.json();
          if (!jobUrl) {
               return NextResponse.json({ error: "Missing jobUrl" }, { status: 400 });
          }

          if (!hasGeminiKey()) {
               return NextResponse.json(
                    { error: "RezoomAI is not configured yet." },
                    { status: 503 }
               );
          }

          // 1. Fetch Candidate Profile and verify Master Resume exists
          const profile = await prisma.candidateProfile.findUnique({
               where: { userId: session.user.id },
          });

          if (!profile || !profile.masterResume) {
               return NextResponse.json(
                    { error: "Master Resume not found. Please complete Step 1: Setup Profile." },
                    { status: 400 }
               );
          }

          // 2. Fetch Job Description from URL
          console.log(`[generate-resume] Fetching job description from ${jobUrl}`);
          let jobDescriptionText = "";
          try {
               const response = await fetch(jobUrl, {
                    headers: {
                         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                    },
               });
               const html = await response.text();
               const $ = cheerio.load(html);

               // Remove noisy tags
               $('script, style, noscript, svg, img, nav, footer, header').remove();
               jobDescriptionText = $('body').text().replace(/\s+/g, ' ').substring(0, 15000); // Cap size
          } catch {
               console.warn(`[generate-resume] Failed to fetch jobUrl. Attempting pure URL match.`);
               jobDescriptionText = `The job is located at: ${jobUrl}`;
          }

          // 3. Ask RezoomAI to generate a targeted custom resume
          console.log(`[generate-resume] Generating custom targeted resume with RezoomAI...`);

          const systemPrompt = `
You are an expert executive resume writer and ATS optimization specialist.
Your goal is to evaluate the Candidate's Master Resume against the provided Job Description.

Instructions:
1. Re-write the Candidate's Master Resume so that it perfectly aligns with the keywords, skills, and requirements found in the Job Description.
2. DO NOT lie or invent new experiences. You must only re-frame, highlight, and prioritize existing truthful experiences from the Master Resume so they match the Job Description.
3. Remove irrelevant bullet points that do not match the target job to keep it concise.
4. Output the final Custom Resume in plain, professional Markdown text. 
5. The format should be standard: Header (Name, Contact), Summary, Experience, Education, Skills.
6. Do NOT include any conversational intro/outro text. The output MUST ONLY be the markdown resume itself.
    `;

          const userPrompt = `
TARGET JOB DESCRIPTION:
${jobDescriptionText}

---

CANDIDATE MASTER RESUME:
${profile.masterResume}
    `;

          const customResume = await generateGeminiText({
               systemPrompt,
               prompt: userPrompt,
               temperature: 0.3,
               maxOutputTokens: 4096,
          });
          console.log(`[generate-resume] Generation complete.`);

          return NextResponse.json({ success: true, resume: customResume });
     } catch (error: unknown) {
          console.error("[generate-resume] error:", error);
          return NextResponse.json(
               { error: error instanceof Error ? error.message : "Failed to generate resume" },
               { status: 500 }
          );
     }
}
