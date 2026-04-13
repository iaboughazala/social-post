const TWITTER_API_BASE = "https://api.twitter.com/2";
const TWITTER_UPLOAD_BASE = "https://upload.twitter.com/1.1";

export class TwitterClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
    };
  }

  async publishPost(content: string, mediaUrl?: string) {
    let mediaId: string | undefined;

    if (mediaUrl) {
      mediaId = await this.uploadMedia(mediaUrl);
    }

    const body: Record<string, unknown> = { text: content };
    if (mediaId) {
      body.media = { media_ids: [mediaId] };
    }

    const res = await fetch(`${TWITTER_API_BASE}/tweets`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        `Twitter API error: ${data.detail || data.title || JSON.stringify(data)}`
      );
    }
    return data;
  }

  private async uploadMedia(mediaUrl: string): Promise<string> {
    // Step 1: Download the media from the URL
    const mediaRes = await fetch(mediaUrl);
    const mediaBuffer = await mediaRes.arrayBuffer();
    const mediaBase64 = Buffer.from(mediaBuffer).toString("base64");
    const contentType = mediaRes.headers.get("content-type") || "image/jpeg";

    // Step 2: INIT upload
    const initRes = await fetch(`${TWITTER_UPLOAD_BASE}/media/upload.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        command: "INIT",
        total_bytes: String(mediaBuffer.byteLength),
        media_type: contentType,
      }),
    });
    const initData = await initRes.json();
    const mediaIdString = initData.media_id_string;

    // Step 3: APPEND upload
    await fetch(`${TWITTER_UPLOAD_BASE}/media/upload.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        command: "APPEND",
        media_id: mediaIdString,
        media_data: mediaBase64,
        segment_index: "0",
      }),
    });

    // Step 4: FINALIZE upload
    const finalizeRes = await fetch(
      `${TWITTER_UPLOAD_BASE}/media/upload.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          command: "FINALIZE",
          media_id: mediaIdString,
        }),
      }
    );
    const finalizeData = await finalizeRes.json();

    return finalizeData.media_id_string;
  }

  async getMe() {
    const res = await fetch(`${TWITTER_API_BASE}/users/me?user.fields=profile_image_url,username,name`, {
      headers: this.headers,
    });
    return res.json();
  }
}
