import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chromium } from "playwright";
import { getAgentPlaybook } from "@/lib/agent/llm";
import { hasGeminiKey } from "@/lib/ai/client";

// Note: Playwright API routes should ideally run on a dedicated worker, 
// but for this MVP, we will run Chromium directly in the Next.js API route.
import fs from "fs";
import path from "path";
import os from "os";

export const maxDuration = 300; // 5 minute timeout since browsing is slow
export const dynamic = "force-dynamic";

function getErrorMessage(error: unknown) {
     return error instanceof Error ? error.message : "Unknown error";
}

export async function POST(request: Request) {
     let browser = null;
     let tmpPdfPath = "";

     try {
          const session = await getServerSession(authOptions);
          if (!session?.user?.id) {
               return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          }

          const { url, jobUrl, customResumeText } = await request.json();
          const targetUrl = url || jobUrl;

          if (!targetUrl) {
               return NextResponse.json({ error: "Missing job URL" }, { status: 400 });
          }

          if (!hasGeminiKey()) {
               return NextResponse.json(
                    { error: "RezoomAI is not configured yet." },
                    { status: 503 }
               );
          }

          // 1. Fetch the user's Candidate Profile
          const profile = await prisma.candidateProfile.findUnique({
               where: { userId: session.user.id },
          });

          if (!profile) {
               return NextResponse.json({ error: "Candidate Profile not setup." }, { status: 400 });
          }

          // 2. Launch headless browser
          console.log(`[apply-agent] Launching browser to navigate to ${targetUrl}`);
          browser = await chromium.launch({ headless: true });
          const context = await browser.newContext({
               userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          });

          // 2.5 Generate Custom PDF from text
          if (customResumeText) {
               console.log(`[apply-agent] Generating Beautiful PDF Resume from AI output...`);
               const pdfPage = await context.newPage();

               // Super fast HTML formatting
               const htmlContent = `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 40px; line-height: 1.6;">
            ${customResumeText.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>')}
          </body>
        </html>
      `;
               await pdfPage.setContent(htmlContent);
               tmpPdfPath = path.join(os.tmpdir(), `custom_resume_${Date.now()}.pdf`);
               await pdfPage.pdf({ path: tmpPdfPath, format: 'A4' });
               await pdfPage.close();
               console.log(`[apply-agent] Custom PDF Resume baked at: ${tmpPdfPath}`);
          }

          const page = await context.newPage();

          // 3. Navigate to the job application URL
          // We use domcontentloaded to speed things up (don't wait for all images)
          await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

          console.log(`[apply-agent] Successfully loaded page: ${await page.title()}`);

          // Wait a brief moment for any dynamic React/Vue forms to render
          await page.waitForTimeout(3000);

          // 4. Extract Form HTML
          // We only care about inputs, selects, labels, and textareas.
          // Strip out SVGs, Scripts, Styles, Headers to save LLM tokens.
          const formHtml = await page.evaluate(() => {
               // Find the main form or main content area
               const formElement = document.querySelector('form') || document.body;

               // Clone it so we don't destroy the real page
               const clone = formElement.cloneNode(true) as HTMLElement;

               // Remove noisy tags
               const noisyTags = ['svg', 'script', 'style', 'noscript', 'img', 'nav', 'footer', 'header'];
               noisyTags.forEach(tag => {
                    const elements = clone.querySelectorAll(tag);
                    elements.forEach(el => el.remove());
               });

               return clone.innerHTML.substring(0, 15000); // Cap size to avoid LLM token limits
          });

          console.log(`[apply-agent] Extracted ${formHtml.length} characters of HTML form data.`);

          // 5. Ask RezoomAI for the playbook mapping
          console.log("[apply-agent] Requesting mapping playbook from RezoomAI...");
          const actions = await getAgentPlaybook(formHtml, profile);

          if (actions.length === 0) {
               return NextResponse.json(
                    { error: "RezoomAI could not generate a browser action plan for this application." },
                    { status: 502 }
               );
          }

          console.log(`[apply-agent] Received ${actions.length} instructions from RezoomAI.`);

          // 6. Execute the Playbook!
          const executionLogs = [];

          for (const step of actions) {
               try {
                    // Wait briefly between actions to mimic human interaction and allow React scripts to catch up
                    await page.waitForTimeout(500);

                    if (step.action === "fill" && step.value) {
                         await page.fill(step.locator, step.value);
                         executionLogs.push(`Filled ${step.locator}`);
                    } else if (step.action === "selectOption" && step.value) {
                         await page.selectOption(step.locator, step.value);
                         executionLogs.push(`Selected ${step.value} on ${step.locator}`);
                    } else if (step.action === "check") {
                         await page.check(step.locator);
                         executionLogs.push(`Checked ${step.locator}`);
                    } else if (step.action === "uploadcv") {
                         if (tmpPdfPath && fs.existsSync(tmpPdfPath)) {
                              await page.setInputFiles(step.locator, tmpPdfPath);
                              executionLogs.push(`Uploaded Custom AI PDF Resume to ${step.locator}`);
                         } else {
                              executionLogs.push(`[SKIPPED] Upload CV on ${step.locator} (No custom resume provided or missing PDF file)`);
                         }
                    } else if (step.action === "click") {
                         await page.click(step.locator);
                         executionLogs.push(`Clicked ${step.locator}`);
                    }
               } catch (error: unknown) {
                    console.warn(`[apply-agent] Step failed on locator ${step.locator}:`, getErrorMessage(error));
                    executionLogs.push(`[FAILED] Action ${step.action} on ${step.locator}`);
               }
          }

          console.log("[apply-agent] Execution complete.");

          // Return the execution result
          return NextResponse.json({
               success: true,
               message: "Browser agent executed playbook successfully.",
               logs: executionLogs
          });
     } catch (error: unknown) {
          console.error("[apply-agent] error:", error);
          return NextResponse.json({ error: getErrorMessage(error) || "Failed to run agent" }, { status: 500 });
     } finally {
          if (browser) {
               await browser.close();
               console.log("[apply-agent] Browser closed.");
          }
     }
}
