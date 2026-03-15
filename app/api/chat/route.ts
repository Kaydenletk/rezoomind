import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateGeminiText, hasGeminiKey } from "@/lib/ai/client";

type ChatMessage = {
     role: "user" | "assistant";
     content: string;
};

export async function POST(request: Request) {
     try {
          const body: unknown = await request.json();
          const parsedBody =
               typeof body === "object" && body !== null
                    ? (body as {
                         messages?: Array<{ role?: unknown; content?: unknown }>;
                         jobUrl?: unknown;
                         jobId?: unknown;
                         quickActionSystemPrompt?: unknown;
                    })
                    : {};

          if (!Array.isArray(parsedBody.messages)) {
               return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
          }

          const messages: ChatMessage[] = parsedBody.messages
               .filter(
                    (message): message is { role: "user" | "assistant"; content: string } =>
                         typeof message === "object" &&
                         message !== null &&
                         (message.role === "user" || message.role === "assistant") &&
                         typeof message.content === "string"
               )
               .map((message) => ({
                    role: message.role,
                    content: message.content,
               }));
          const jobUrl = typeof parsedBody.jobUrl === "string" ? parsedBody.jobUrl : undefined;
          const jobId = typeof parsedBody.jobId === "string" ? parsedBody.jobId : undefined;
          const quickActionSystemPrompt =
               typeof parsedBody.quickActionSystemPrompt === "string"
                    ? parsedBody.quickActionSystemPrompt
                    : undefined;

          if (!hasGeminiKey()) {
               return NextResponse.json(
                    { error: "RezoomAI is not configured yet." },
                    { status: 503 }
               );
          }

          // Fetch user context if authenticated
          let resumeContext = "";
          let jobContext = "";

          const session = await getServerSession(authOptions);
          const userId =
               session?.user && "id" in session.user && typeof session.user.id === "string"
                    ? session.user.id
                    : null;
          if (userId) {
               try {
                    // Fetch user's resume
                    const resume = await prisma.resume.findUnique({
                         where: { userId },
                         select: { resume_text: true },
                    });

                    if (resume?.resume_text) {
                         // Truncate to ~4000 chars to leave room for job context + conversation
                         const truncatedResume = resume.resume_text.slice(0, 4000);
                         resumeContext = `\n\nUSER'S RESUME:\n${truncatedResume}`;
                    }

                    // Fetch user's candidate profile for additional context
                    const profile = await prisma.candidateProfile.findUnique({
                         where: { userId },
                         select: {
                              firstName: true,
                              lastName: true,
                              linkedinUrl: true,
                              githubUrl: true,
                         },
                    });

                    if (profile) {
                         const profileParts = [];
                         if (profile.firstName) profileParts.push(`Name: ${profile.firstName} ${profile.lastName || ''}`);
                         if (profile.linkedinUrl) profileParts.push(`LinkedIn: ${profile.linkedinUrl}`);
                         if (profile.githubUrl) profileParts.push(`GitHub: ${profile.githubUrl}`);
                         if (profileParts.length > 0) {
                              resumeContext += `\n\nUSER'S PROFILE:\n${profileParts.join('\n')}`;
                         }
                    }
               } catch (dbError) {
                    console.warn("[api/chat] Skipping resume/profile context:", dbError);
               }
          }

          if (jobId) {
               try {
                    const job = await prisma.job_postings.findUnique({
                         where: { id: jobId },
                         select: {
                              company: true,
                              role: true,
                              location: true,
                              description: true,
                              tags: true,
                              salary_min: true,
                              salary_max: true,
                         },
                    });

                    if (job) {
                         const jobParts = [
                              `Company: ${job.company}`,
                              `Role: ${job.role}`,
                              job.location ? `Location: ${job.location}` : null,
                              job.salary_min ? `Salary: $${job.salary_min}${job.salary_max ? ` - $${job.salary_max}` : '+'}` : null,
                              job.tags?.length ? `Tags: ${job.tags.join(', ')}` : null,
                         ].filter(Boolean);

                         jobContext = `\n\nJOB THE USER IS VIEWING:\n${jobParts.join('\n')}`;

                         if (job.description) {
                              jobContext += `\n\nJOB DESCRIPTION:\n${job.description.slice(0, 3000)}`;
                         }
                    }
               } catch (dbError) {
                    console.warn("[api/chat] Skipping job context:", dbError);
               }
          }

          // Build the context-aware system prompt
          let systemPrompt = `You are RezoomAI, the highly intelligent and professional career assistant for Rezoomind. 
Your primary goal is to help the user secure their dream job by providing expert advice on resumes, cover letters, interview preparation, and application strategies.
Keep your responses concise, actionable, and encouraging. Use markdown for formatting (bullet points, bold text).
${resumeContext ? `\nYou have access to the user's resume and profile data below. Use this to provide personalized, specific advice. Reference their actual skills, experience, and background when relevant.${resumeContext}` : ''}
${jobContext ? `\nThe user is currently viewing a specific job posting. When they ask about this job, provide tailored advice based on how their resume matches this role. Identify skill gaps and strengths.${jobContext}` : ''}
${jobUrl && !jobId ? `\nIMPORTANT CONTEXT: The user is currently looking at a job posting at this URL: ${jobUrl}. If they ask specific questions about the job, try to give advice relevant to the role.` : ''}`;

          if (quickActionSystemPrompt?.trim()) {
               systemPrompt += `\n\nQUICK ACTION FOCUS:\n${quickActionSystemPrompt.trim()}`;
          }

          const transcript = messages
               .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`)
               .join("\n\n");

          const reply = await generateGeminiText({
               systemPrompt,
               prompt: `Continue this conversation naturally.\n\n${transcript}`,
               temperature: 0.7,
               maxOutputTokens: 1500,
          });

          return NextResponse.json({ reply });
     } catch (error: unknown) {
          console.error("[api/chat] POST error:", error);
          const message = error instanceof Error ? error.message : "Failed to communicate with RezoomAI";
          return NextResponse.json(
               { error: message },
               { status: 500 }
          );
     }
}
