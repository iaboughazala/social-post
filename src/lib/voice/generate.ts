import { query } from "@anthropic-ai/claude-agent-sdk";

const DEFAULT_GENERATE_MODEL = "sonnet";
const DEFAULT_ANALYZE_MODEL = "opus";

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
  /** Unused with Agent SDK — kept for signature compat with old Anthropic-SDK code. */
  maxTokens?: number;
  /** Unused — Agent SDK does not expose temperature. */
  temperature?: number;
}

/**
 * Run a single Claude turn via the Claude Agent SDK.
 * Authenticates through the local Claude Code CLI subscription (no API key),
 * so voice generation is free under the user's Max plan.
 *
 * Tools are disabled — we want pure text generation, not agentic behavior.
 * System prompt is injected via append-system-prompt so the SDK's built-in
 * "You are Claude Code" prefix does not conflict with our voice guidance.
 */
export async function runClaude(opts: RunOptions): Promise<string> {
  const collected: string[] = [];

  const stream = query({
    prompt: opts.userPrompt,
    options: {
      model: opts.model || getGenerateModel(),
      maxTurns: 1,
      allowedTools: [],
      permissionMode: "bypassPermissions",
      systemPrompt: opts.systemPrompt,
      env: {
        ...process.env,
        CLAUDE_AGENT_SDK_CLIENT_APP: "social-post-voice/0.1.0",
      } as NodeJS.ProcessEnv,
    },
  });

  for await (const message of stream) {
    if (message.type === "assistant") {
      const content = message.message?.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === "text" && typeof block.text === "string") {
            collected.push(block.text);
          }
        }
      }
    } else if (message.type === "result" && collected.length === 0) {
      const r = (message as { result?: unknown }).result;
      if (typeof r === "string") collected.push(r);
    }
  }

  return collected.join("").trim();
}
