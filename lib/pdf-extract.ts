import pdf from "pdf-parse";

/**
 * Extract plain text from a PDF buffer.
 * Returns the concatenated text of all pages.
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text.trim();
}
