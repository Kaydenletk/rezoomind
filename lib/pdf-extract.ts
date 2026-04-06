import pdf from "pdf-parse";

/**
 * Extract plain text from a PDF buffer.
 * Returns the concatenated text of all pages.
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}
