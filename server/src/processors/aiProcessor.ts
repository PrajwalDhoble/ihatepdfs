import pdfParse from "pdf-parse";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";
import { ProcessorInput } from "./index.js";

function assertAiConfigured(): void {
  if (!env.aiApiKey) {
    throw new AppError(
      "This tool needs a Gemini API key. Get a free key at https://aistudio.google.com/apikey and set AI_API_KEY in server/.env.",
      "AI_NOT_CONFIGURED",
      503
    );
  }
}

async function extractText(filePath: string): Promise<string> {
  try {
    const buffer = await fs.readFile(filePath);
    const result = await pdfParse(buffer);
    return result.text;
  } catch {
    throw new AppError("Couldn't read this PDF's text — it may be scanned/image-only or corrupted.", "EXTRACT_FAILED", 400);
  }
}

// Gemini's context window is large, but this stays a conservative,
// deliberately simple character cap rather than a real tokenizer.
const MAX_CHARS = 24000;

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
  promptFeedback?: {
    blockReason?: string;
  };
}

/**
 * Calls Google's Gemini API (generateContent). Gemini was chosen as the
 * default over OpenAI specifically because it has a genuinely usable free
 * tier — this app isn't generating revenue yet, so a free AI provider
 * matters. Any Gemini-compatible request/response shape works; if you
 * switch providers, this is the one function that needs updating.
 */
async function callAi(systemPrompt: string, userPrompt: string): Promise<string> {
  const url = `${env.aiApiUrl}/models/${env.aiModel}:generateContent?key=${env.aiApiKey}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.3 },
      }),
    });
  } catch (err) {
    throw new AppError(
      `Couldn't reach the AI service. (${err instanceof Error ? err.message : "network error"})`,
      "AI_NETWORK_ERROR",
      502
    );
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    if (res.status === 401 || res.status === 403) {
      throw new AppError(`Gemini rejected the API key (HTTP ${res.status}). Check AI_API_KEY in server/.env.`, "AI_AUTH_FAILED", 502);
    }
    if (res.status === 429) {
      throw new AppError("Gemini's free-tier rate limit was hit. Wait a moment and try again.", "AI_RATE_LIMITED", 429);
    }
    throw new AppError(`The AI service returned an error (HTTP ${res.status}). ${body.slice(0, 300)}`, "AI_ERROR", 502);
  }

  let json: GeminiResponse;
  try {
    json = (await res.json()) as GeminiResponse;
  } catch {
    throw new AppError("The AI service returned a response that wasn't valid JSON.", "AI_BAD_RESPONSE", 502);
  }

  if (json.promptFeedback?.blockReason) {
    throw new AppError(`Gemini declined to respond (reason: ${json.promptFeedback.blockReason}).`, "AI_BLOCKED", 502);
  }

  const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new AppError("The AI service returned an empty response.", "AI_BAD_RESPONSE", 502);
  return content;
}

export async function summarizePdf({ inputPaths, outputDir }: ProcessorInput): Promise<string[]> {
  assertAiConfigured();
  const text = await extractText(inputPaths[0]);
  if (!text.trim()) {
    throw new AppError("No extractable text was found in this PDF — it may be scanned/image-only.", "NO_TEXT", 400);
  }

  const summary = await callAi(
    "You summarize documents clearly and concisely for a general reader. Use plain language and keep the summary well-organized.",
    `Summarize the following document:\n\n${text.slice(0, MAX_CHARS)}`
  );

  const outputPath = path.join(outputDir, "summary.txt");
  await fs.writeFile(outputPath, summary);
  return [outputPath];
}

interface AskPdfOptions {
  question?: string;
}

export async function askPdf({ inputPaths, outputDir, options }: ProcessorInput): Promise<string[]> {
  assertAiConfigured();
  const opts = options as AskPdfOptions;
  const question = (opts.question ?? "").trim();
  if (!question) throw new AppError("Enter a question to ask about the PDF.", "MISSING_OPTIONS", 400);

  const text = await extractText(inputPaths[0]);
  if (!text.trim()) {
    throw new AppError("No extractable text was found in this PDF — it may be scanned/image-only.", "NO_TEXT", 400);
  }

  const answer = await callAi(
    "You answer questions about a document strictly using the document's content. If the answer isn't in the document, say so clearly rather than guessing.",
    `Document:\n\n${text.slice(0, MAX_CHARS)}\n\nQuestion: ${question}`
  );

  const outputPath = path.join(outputDir, "answer.txt");
  await fs.writeFile(outputPath, `Q: ${question}\n\nA: ${answer}`);
  return [outputPath];
}

interface TranslatePdfOptions {
  targetLanguage?: string;
}

export async function translatePdf({ inputPaths, outputDir, options }: ProcessorInput): Promise<string[]> {
  assertAiConfigured();
  const opts = options as TranslatePdfOptions;
  const targetLanguage = (opts.targetLanguage ?? "").trim();
  if (!targetLanguage) throw new AppError("Choose a target language to translate into.", "MISSING_OPTIONS", 400);

  const text = await extractText(inputPaths[0]);
  if (!text.trim()) {
    throw new AppError("No extractable text was found in this PDF — it may be scanned/image-only.", "NO_TEXT", 400);
  }

  const translation = await callAi(
    `You translate documents accurately and naturally into ${targetLanguage}, preserving meaning, tone, and paragraph structure. Return only the translated text, with no commentary.`,
    text.slice(0, MAX_CHARS)
  );

  const outputPath = path.join(outputDir, `translation-${targetLanguage.toLowerCase().replace(/\s+/g, "-")}.txt`);
  await fs.writeFile(outputPath, translation);
  return [outputPath];
}

export async function reviewResume({ inputPaths, outputDir }: ProcessorInput): Promise<string[]> {
  assertAiConfigured();
  const text = await extractText(inputPaths[0]);
  if (!text.trim()) {
    throw new AppError("No extractable text was found in this PDF — it may be scanned/image-only.", "NO_TEXT", 400);
  }

  const review = await callAi(
    "You are an experienced hiring manager and resume reviewer. Give clear, constructive, specific feedback on a resume: clarity, impact of bullet points (are they specific and measurable, or vague?), structure, and anything that would likely hurt it with an applicant tracking system. Be direct and practical, not just encouraging.",
    `Resume content:\n\n${text.slice(0, MAX_CHARS)}`
  );

  const outputPath = path.join(outputDir, "resume-review.txt");
  await fs.writeFile(outputPath, review);
  return [outputPath];
}
