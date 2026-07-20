/**
 * Wasla (bio-link + articles) as a publishing destination.
 * Contract:
 *   GET  {baseUrl}/me       → { id, name, handle, avatar, profileUrl }
 *   POST {baseUrl}/publish  → { articleId, articleUrl, duplicate? }
 * Auth: Authorization: Bearer <apiKey>
 */

export interface WaslaProfile {
  id: string;
  name: string;
  handle: string;
  avatar: string | null;
  profileUrl: string;
}

// Extract hashtags in a Unicode-aware way — Arabic and Latin scripts both count.
export function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\p{Letter}\p{Number}_]+/gu);
  if (!matches) return [];
  return Array.from(new Set(matches));
}

export class WaslaClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.apiKey = apiKey;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  async getProfile(): Promise<WaslaProfile> {
    const res = await fetch(`${this.baseUrl}/me`, { headers: this.headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        (data as { error?: string })?.error ||
          `Wasla /me failed (${res.status})`
      );
    }
    return data as WaslaProfile;
  }

  async publishPost(
    content: string,
    mediaUrl: string | undefined,
    sourcePostId: string
  ): Promise<{ id: string; url: string; duplicate: boolean }> {
    const hashtags = extractHashtags(content);
    const body = {
      content,
      sourcePostId,
      hashtags,
      mediaUrls: mediaUrl ? [mediaUrl] : [],
    };
    const res = await fetch(`${this.baseUrl}/publish`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        (data as { error?: string })?.error ||
          `Wasla /publish failed (${res.status})`
      );
    }
    const d = data as { articleId: string; articleUrl: string; duplicate?: boolean };
    return { id: d.articleId, url: d.articleUrl, duplicate: !!d.duplicate };
  }
}
