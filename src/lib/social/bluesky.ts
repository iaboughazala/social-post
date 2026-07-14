import { AtpAgent } from "@atproto/api";

const SERVICE = "https://bsky.social";

/**
 * Bluesky client. Uses handle + app password (created by the user in
 * bsky.app → Settings → App Passwords). No OAuth flow, no dev app required.
 */
export class BlueskyClient {
  private handle: string;
  private appPassword: string;

  constructor(handle: string, appPassword: string) {
    this.handle = handle;
    this.appPassword = appPassword;
  }

  private async agent(): Promise<AtpAgent> {
    const agent = new AtpAgent({ service: SERVICE });
    await agent.login({ identifier: this.handle, password: this.appPassword });
    return agent;
  }

  async getProfile() {
    const agent = await this.agent();
    const me = agent.session?.did;
    if (!me) throw new Error("No session after login");
    const profile = await agent.getProfile({ actor: me });
    return {
      did: me,
      handle: agent.session?.handle ?? this.handle,
      displayName: profile.data.displayName ?? this.handle,
      avatar: profile.data.avatar ?? null,
    };
  }

  async publishPost(_ownerDid: string, content: string, mediaUrl?: string) {
    const agent = await this.agent();

    if (mediaUrl) {
      // Fetch image, upload to PDS, attach as embed
      const imgRes = await fetch(mediaUrl);
      if (!imgRes.ok) throw new Error(`Failed to fetch media at ${mediaUrl}`);
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const contentType = imgRes.headers.get("content-type") || "image/jpeg";
      const upload = await agent.uploadBlob(buf, { encoding: contentType });
      const post = await agent.post({
        text: content,
        embed: {
          $type: "app.bsky.embed.images",
          images: [
            {
              image: upload.data.blob,
              alt: content.slice(0, 200),
            },
          ],
        },
      });
      return { id: post.uri, cid: post.cid };
    }

    const post = await agent.post({ text: content });
    return { id: post.uri, cid: post.cid };
  }
}
