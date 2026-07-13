import Anthropic from "@anthropic-ai/sdk";

const DEFAULT_GENERATE_MODEL = "claude-sonnet-5";
const DEFAULT_ANALYZE_MODEL = "claude-opus-4-8";

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  return new Anthropic({ apiKey });
}

export function getGenerateModel(): string {
  return process.env.VOICE_MODEL_GENERATE || DEFAULT_GENERATE_MODEL;
}

export function getAnalyzeModel(): string {
  return process.env.VOICE_MODEL_ANALYZE || DEFAULT_ANALYZE_MODEL;
}

export interface RunOptions {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export async function runClaude(opts: RunOptions): Promise<string> {
  const client = getClient();
  const message = await client.messages.create({
    model: opts.model || getGenerateModel(),
    max_tokens: opts.maxTokens ?? 4096,
    temperature: opts.temperature ?? 0.8,
    system: opts.systemPrompt,
    messages: [{ role: "user", content: opts.userPrompt }],
  });

  const chunks: string[] = [];
  for (const block of message.content) {
    if (block.type === "text") {
      chunks.push(block.text);
    }
  }
  return chunks.join("").trim();
}
