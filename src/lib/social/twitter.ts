const API_BASE = "https://api.x.com/2";

export class TwitterClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private get jsonHeaders() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
    };
  }

  async publishPost(content: string, mediaUrl?: string) {
    const body: Record<string, unknown> = { text: content };

    if (mediaUrl) {
      const mediaId = await this.uploadMedia(mediaUrl);
      body.media = { media_ids: [mediaId] };
    }

    const res = await fetch(`${API_BASE}/tweets`, {
      method: "POST",
      headers: this.jsonHeaders,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        `Twitter API error (${res.status}): ${data.detail || data.title || JSON.stringify(data)}`
      );
    }
    return data.data || data;
  }

  /**
   * Upload media via v2 media upload (simple upload — images up to 5MB).
   * Returns the media_id_string.
   */
  private async uploadMedia(mediaUrl: string): Promise<string> {
    const mediaRes = await fetch(mediaUrl);
    if (!mediaRes.ok) {
      throw new Error(`Failed to fetch media at ${mediaUrl}`);
    }
    const buf = Buffer.from(await mediaRes.arrayBuffer());
    const contentType = mediaRes.headers.get("content-type") || "image/jpeg";
    const mediaCategory = contentType.startsWith("video/")
      ? "tweet_video"
      : contentType === "image/gif"
        ? "tweet_gif"
        : "tweet_image";

    const form = new FormData();
    form.append(
      "media",
      new Blob([new Uint8Array(buf)], { type: contentType })
    );
    form.append("media_category", mediaCategory);

    const res = await fetch(`${API_BASE}/media/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.accessToken}` },
      body: form,
    });
    const data = await res.json();
    if (!res.ok || !(data.data?.id || data.media_id_string)) {
      throw new Error(
        `Twitter media upload failed (${res.status}): ${JSON.stringify(data)}`
      );
    }
    return (data.data?.id || data.media_id_string) as string;
  }

  async getMe() {
    const res = await fetch(
      `${API_BASE}/users/me?user.fields=profile_image_url,username,name`,
      { headers: { Authorization: `Bearer ${this.accessToken}` } }
    );
    return res.json();
  }
}
