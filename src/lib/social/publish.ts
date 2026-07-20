import { decryptToken } from "@/lib/crypto";
import { FacebookClient } from "./facebook";
import { TwitterClient } from "./twitter";
import { LinkedInClient } from "./linkedin";
import { BlueskyClient } from "./bluesky";
import { WaslaClient } from "./wasla";

export interface SocialAccountForPublish {
  platform: string;
  platformId: string;
  accessToken: string;
}

export async function publishToPlatform(
  account: SocialAccountForPublish,
  content: string,
  mediaUrl?: string,
  /**
   * Opaque post id from Social-Post. Currently only used by the Wasla
   * integration for idempotent republish, but plumbed through so any
   * future destination can use it for tracing / dedupe.
   */
  sourcePostId?: string
): Promise<Record<string, unknown>> {
  const token = decryptToken(account.accessToken);

  switch (account.platform) {
    case "linkedin": {
      const li = new LinkedInClient(token);
      return li.publishPost(account.platformId, content, mediaUrl);
    }
    case "facebook":
    case "instagram": {
      const fb = new FacebookClient(token);
      return fb.publishPost(account.platformId, content, mediaUrl);
    }
    case "twitter": {
      const tw = new TwitterClient(token);
      return tw.publishPost(content, mediaUrl);
    }
    case "bluesky": {
      const sep = token.indexOf("\x00");
      if (sep === -1) throw new Error("Malformed Bluesky credentials");
      const handle = token.slice(0, sep);
      const appPassword = token.slice(sep + 1);
      const bsky = new BlueskyClient(handle, appPassword);
      return bsky.publishPost(account.platformId, content, mediaUrl);
    }
    case "wasla": {
      const sep = token.indexOf("\x00");
      if (sep === -1) throw new Error("Malformed Wasla credentials");
      const baseUrl = token.slice(0, sep);
      const apiKey = token.slice(sep + 1);
      const wasla = new WaslaClient(baseUrl, apiKey);
      // sourcePostId is required by the Wasla contract for idempotency.
      // Fall back to platformId so retries still de-dupe if we ever call
      // without a post id in scope.
      const traceId = sourcePostId || account.platformId;
      return wasla.publishPost(content, mediaUrl, traceId);
    }
    default:
      throw new Error(`Unsupported platform: ${account.platform}`);
  }
}
