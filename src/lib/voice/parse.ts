export interface ParsedVariant {
  content: string;
  hook: string;
  hashtags: string[];
}

const VARIANT_DELIMITER = /^\s*=+\s*VARIANT\s*=+\s*$/im;

/**
 * Split raw response by ===VARIANT=== markers and extract hook + hashtags.
 * Hook = first non-empty line. Hashtags = any line that is mostly #tags.
 */
export function parseVariants(raw: string): ParsedVariant[] {
  if (!raw?.trim()) return [];

  const chunks = raw
    .split(VARIANT_DELIMITER)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  return chunks.map((chunk) => extractVariant(chunk));
}

function extractVariant(text: string): ParsedVariant {
  const trimmed = text.trim();
  const lines = trimmed.split(/\r?\n/);

  const firstLine = lines.find((l) => l.trim().length > 0) || "";
  const hook = firstLine.trim().slice(0, 500);

  // Find the last line that looks like a hashtag line
  const hashtags: string[] = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line) continue;
    const matches = line.match(/#[^\s#]+/g);
    if (matches && matches.length >= 2) {
      hashtags.push(...matches);
      break;
    }
    // Stop scanning if we hit a non-hashtag content line at the bottom
    if (line.length > 40 && !line.startsWith("#")) break;
  }

  return {
    content: trimmed,
    hook,
    hashtags,
  };
}

/**
 * Extract a JSON object from a raw LLM response that may be wrapped in
 * markdown code fences or preceded by prose.
 */
export function extractJson<T = unknown>(raw: string): T {
  const cleaned = raw
    .replace(/^```json\s*/im, "")
    .replace(/^```\s*/im, "")
    .replace(/```\s*$/im, "")
    .trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("No JSON object found in response");
  }
  const jsonStr = cleaned.slice(first, last + 1);
  return JSON.parse(jsonStr) as T;
}
