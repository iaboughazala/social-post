import { decryptToken } from "@/lib/crypto";
import { FacebookClient } from "./facebook";
import { TwitterClient } from "./twitter";
import { LinkedInClient } from "./linkedin";

export interface SocialAccountForPublish {
  platform: string;
  platformId: string;
  accessToken: string;
}

export async function publishToPlatform(
  account: SocialAccountForPublish,
  content: string,
  mediaUrl?: string
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
    default:
      throw new Error(`Unsupported platform: ${account.platform}`);
  }
}
