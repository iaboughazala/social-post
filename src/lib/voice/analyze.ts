import type { SamplePost } from "@prisma/client";
import { runClaude, getAnalyzeModel } from "./generate";
import { ANALYZE_STYLE_PROMPT } from "./prompts";
import { extractJson } from "./parse";

export interface AnalyzedStyle {
  toneSummary: string;
  voicePillars: string[];
  vocabularyNotes: string;
  structureNotes: string;
  doList: string[];
  dontList: string[];
  rawAnalysis: string;
}

export interface AnalyzeResult {
  style: AnalyzedStyle;
  model: string;
}

export async function analyzeStyle(samples: SamplePost[]): Promise<AnalyzeResult> {
  if (samples.length === 0) {
    throw new Error("At least one sample post is required to analyze style");
  }

  const model = getAnalyzeModel();
  const samplesText = samples
    .map((s, i) => `### بوست ${i + 1}\n${s.content}`)
    .join("\n\n---\n\n");

  const raw = await runClaude({
    systemPrompt: ANALYZE_STYLE_PROMPT,
    userPrompt: samplesText,
    model,
    maxTokens: 4096,
    temperature: 0.3,
  });

  const parsed = extractJson<Partial<AnalyzedStyle>>(raw);

  const style: AnalyzedStyle = {
    toneSummary: String(parsed.toneSummary ?? "").trim(),
    voicePillars: Array.isArray(parsed.voicePillars)
      ? parsed.voicePillars.map(String)
      : [],
    vocabularyNotes: String(parsed.vocabularyNotes ?? "").trim(),
    structureNotes: String(parsed.structureNotes ?? "").trim(),
    doList: Array.isArray(parsed.doList) ? parsed.doList.map(String) : [],
    dontList: Array.isArray(parsed.dontList) ? parsed.dontList.map(String) : [],
    rawAnalysis: String(parsed.rawAnalysis ?? "").trim(),
  };

  return { style, model };
}
