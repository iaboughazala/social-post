const REST_BASE = "https://api.linkedin.com/rest";
const V2_BASE = "https://api.linkedin.com/v2";
const LINKEDIN_VERSION = "202409";

export class LinkedInClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private get restHeaders() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": LINKEDIN_VERSION,
      "X-Restli-Protocol-Version": "2.0.0",
    };
  }

  /**
   * Publish a text (and optional single-image) post using the Posts API.
   * personId is the LinkedIn member sub (from OpenID userinfo).
   */
  async publishPost(personId: string, content: string, mediaUrl?: string) {
    const author = `urn:li:person:${personId}`;

    const body: Record<string, unknown> = {
      author,
      commentary: content,
      visibility: "PUBLIC",
      distribution: {
        feedDistribution: "MAIN_FEED",
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      lifecycleState: "PUBLISHED",
      isReshareDisabledByAuthor: false,
    };

    if (mediaUrl) {
      const imageUrn = await this.uploadImage(author, mediaUrl);
      body.content = {
        media: {
          id: imageUrn,
        },
      };
    }

    const res = await fetch(`${REST_BASE}/posts`, {
      method: "POST",
      headers: this.restHeaders,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`LinkedIn Posts API error (${res.status}): ${errText}`);
    }

    const postUrn = res.headers.get("x-restli-id") || res.headers.get("x-linkedin-id");
    return { id: postUrn };
  }

  /**
   * Upload an image via the Images API (rest) and return the image URN
   * (e.g. urn:li:image:xxx) suitable for the Posts API `content.media.id`.
   */
  private async uploadImage(ownerUrn: string, mediaUrl: string): Promise<string> {
    // Step 1: initialize upload
    const initRes = await fetch(`${REST_BASE}/images?action=initializeUpload`, {
      method: "POST",
      headers: this.restHeaders,
      body: JSON.stringify({
        initializeUploadRequest: { owner: ownerUrn },
      }),
    });
    if (!initRes.ok) {
      throw new Error(`LinkedIn image init failed: ${await initRes.text()}`);
    }
    const initData = await initRes.json();
    const uploadUrl = initData.value.uploadUrl as string;
    const imageUrn = initData.value.image as string;

    // Step 2: download source and PUT to LinkedIn upload URL
    const mediaRes = await fetch(mediaUrl);
    if (!mediaRes.ok) {
      throw new Error(`Failed to fetch media at ${mediaUrl}`);
    }
    const mediaBuffer = Buffer.from(await mediaRes.arrayBuffer());
    const contentType = mediaRes.headers.get("content-type") || "image/jpeg";

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": contentType,
      },
      body: mediaBuffer,
    });
    if (!uploadRes.ok) {
      throw new Error(`LinkedIn image upload failed: ${uploadRes.status}`);
    }

    return imageUrn;
  }

  async getProfile() {
    const res = await fetch(`${V2_BASE}/userinfo`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    return res.json();
  }
}
