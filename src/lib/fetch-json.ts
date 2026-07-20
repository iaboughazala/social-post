/**
 * Safe JSON body reader.
 *
 * Returns null if the body is empty or not valid JSON (e.g. nginx 504
 * HTML page). Callers should still check response.ok separately and
 * treat null as "no structured error payload".
 */
export async function safeJson<T = unknown>(response: Response): Promise<T | null> {
  const text = await response.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Build a user-facing error message from a Response that isn't ok.
 * Prefers the { error } field from a JSON body, falls back to a status
 * hint that specifically calls out gateway timeouts (which typically
 * mean the backend still completed).
 */
export function errorFromResponse(
  response: Response,
  parsed: { error?: unknown } | null
): string {
  if (parsed && typeof parsed.error === "string") return parsed.error;
  if (response.status === 502 || response.status === 504) {
    return "Request took too long — check the queue in a moment, it may have completed.";
  }
  if (response.status === 401) return "Session expired — reload the page.";
  return `Request failed (${response.status})`;
}
