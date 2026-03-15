import pdfParse from "pdf-parse";
import mammoth from "mammoth";

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const MAX_BYTES = toNumber(process.env.RESUME_PARSE_MAX_BYTES, 2_000_000);

const normalizeText = (text: string) =>
  text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .replace(/\s+/g, " ")
    .trim();

const getExtension = (path: string) => {
  const parts = path.split("?");
  const cleanPath = parts[0];
  const ext = cleanPath.split(".").pop()?.toLowerCase();
  return ext ?? "";
};

const fetchBuffer = async (url: string, maxBytes: number) => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to download resume file.");
  }
  const lengthHeader = response.headers.get("content-length");
  if (lengthHeader && Number(lengthHeader) > maxBytes) {
    throw new Error("Resume file is too large to parse.");
  }
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > maxBytes) {
    throw new Error("Resume file is too large to parse.");
  }
  return Buffer.from(buffer);
};

export async function parseResumeFromUrl(
  url: string
): Promise<{ text: string; bytes: number }> {
  let rawText = "";
  let buffer: Buffer;

  try {
    buffer = await fetchBuffer(url, MAX_BYTES);
  } catch (err: unknown) {
    throw new Error(err instanceof Error ? err.message : "Unable to access resume file.");
  }

  const extension = getExtension(url);

  if (extension === "pdf") {
    const parsed = await pdfParse(buffer);
    rawText = parsed.text ?? "";
  } else if (extension === "docx") {
    const parsed = await mammoth.extractRawText({ buffer });
    rawText = parsed.value ?? "";
  } else {
    throw new Error("Unsupported resume file type.");
  }

  const normalized = normalizeText(rawText);
  if (!normalized) {
    throw new Error("Resume file contains no readable text.");
  }

  return { text: normalized, bytes: buffer.byteLength };
}
