const LINKEDIN_API_BASE = "https://api.linkedin.com/v2";

export class LinkedInClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    };
  }

  async publishPost(personId: string, content: string, mediaUrl?: string) {
    let media: Record<string, unknown>[] | undefined;

    if (mediaUrl) {
      const asset = await this.uploadImage(personId, mediaUrl);
      media = [
        {
          status: "READY",
          description: { text: content.substring(0, 200) },
          media: asset,
          title: { text: "Post media" },
        },
      ];
    }

    const ugcPost: Record<string, unknown> = {
      author: `urn:li:person:${personId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: content },
          shareMediaCategory: media ? "IMAGE" : "NONE",
          ...(media ? { media } : {}),
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    };

    const res = await fetch(`${LINKEDIN_API_BASE}/ugcPosts`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(ugcPost),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        `LinkedIn API error: ${data.message || JSON.stringify(data)}`
      );
    }
    return data;
  }

  private async uploadImage(
    personId: string,
    mediaUrl: string
  ): Promise<string> {
    // Step 1: Register upload
    const registerRes = await fetch(
      `${LINKEDIN_API_BASE}/assets?action=registerUpload`,
      {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
            owner: `urn:li:person:${personId}`,
            serviceRelationships: [
              {
                relationshipType: "OWNER",
                identifier: "urn:li:userGeneratedContent",
              },
            ],
          },
        }),
      }
    );
    const registerData = await registerRes.json();
    const uploadUrl =
      registerData.value.uploadMechanism[
        "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
      ].uploadUrl;
    const asset = registerData.value.asset;

    // Step 2: Download media and upload to LinkedIn
    const mediaRes = await fetch(mediaUrl);
    const mediaBuffer = await mediaRes.arrayBuffer();

    await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": mediaRes.headers.get("content-type") || "image/jpeg",
      },
      body: Buffer.from(mediaBuffer),
    });

    return asset;
  }

  async getProfile() {
    const res = await fetch(
      `${LINKEDIN_API_BASE}/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))`,
      { headers: this.headers }
    );
    return res.json();
  }
}
