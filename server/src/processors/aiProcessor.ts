import pdfParse from "pdf-parse";
import fs from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";
import { ProcessorInput } from "./index.js";

function assertAiConfigured(): void {
  if (!env.aiApiKey) {
    throw new AppError(
      "This tool needs an AI API key. Set AI_API_KEY in server/.env (any OpenAI-compatible provider works; set AI_API_URL too if not using OpenAI directly).",
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

// Most chat-completion APIs enforce a token limit well below what a long
// PDF's raw text would use — this is a simple, safe character cap rather
// than a real tokenizer, deliberately conservative.
const MAX_CHARS = 24000;

async function callAi(systemPrompt: string, userPrompt: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(env.aiApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.aiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.aiModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
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
      throw new AppError(`The AI service rejected the API key (HTTP ${res.status}). Check AI_API_KEY in server/.env.`, "AI_AUTH_FAILED", 502);
    }
    throw new AppError(`The AI service returned an error (HTTP ${res.status}). ${body.slice(0, 300)}`, "AI_ERROR", 502);
  }

  let json: { choices?: { message?: { content?: string } }[] };
  try {
json = (await res.json()) as {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
};  } catch {
    throw new AppError("The AI service returned a response that wasn't valid JSON.", "AI_BAD_RESPONSE", 502);
  }

  const content = json.choices?.[0]?.message?.content;
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
