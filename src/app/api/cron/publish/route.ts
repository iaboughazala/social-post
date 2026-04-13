import { NextRequest, NextResponse } from "next/server";
import { FacebookClient } from "@/lib/social/facebook";
import { TwitterClient } from "@/lib/social/twitter";
import { LinkedInClient } from "@/lib/social/linkedin";

export const dynamic = "force-dynamic";

const MAX_RETRIES = 3;

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { db } = await import("@/lib/db");

  // Find all posts that are scheduled and due
  const now = new Date();
  const posts = await db.post.findMany({
    where: {
      status: "scheduled",
      scheduledAt: { lte: now },
    },
    include: {
      postAccounts: {
        include: {
          socialAccount: true,
        },
      },
    },
  });

  const results: Array<{ postId: string; status: string }> = [];

  for (const post of posts) {
    // Mark as publishing
    await db.post.update({
      where: { id: post.id },
      data: { status: "publishing" },
    });

    const mediaUrls = post.mediaUrls
      ? (JSON.parse(post.mediaUrls) as string[])
      : [];
    const firstMedia = mediaUrls[0] || undefined;

    let allSucceeded = true;

    for (const postAccount of post.postAccounts) {
      const { socialAccount } = postAccount;
      let attempt = 0;
      let success = false;
      let lastError = "";
      let platformPostId: string | undefined;

      while (attempt < MAX_RETRIES && !success) {
        attempt++;
        try {
          const result = await publishToplatform(
            socialAccount.platform,
            socialAccount.accessToken,
            socialAccount.platformId,
            post.content,
            firstMedia
          );
          platformPostId = (result as any).id || (result as any).data?.id || undefined;
          success = true;
        } catch (err) {
          lastError =
            err instanceof Error ? err.message : "Unknown error occurred";
          // Wait briefly before retrying (exponential backoff)
          if (attempt < MAX_RETRIES) {
            await delay(1000 * Math.pow(2, attempt - 1));
          }
        }
      }

      if (success) {
        await db.postAccount.update({
          where: { id: postAccount.id },
          data: {
            status: "published",
            platformPostId: platformPostId || null,
          },
        });
      } else {
        allSucceeded = false;
        await db.postAccount.update({
          where: { id: postAccount.id },
          data: {
            status: "failed",
            errorMsg: lastError,
          },
        });
      }
    }

    // Update post status based on results
    await db.post.update({
      where: { id: post.id },
      data: {
        status: allSucceeded ? "published" : "failed",
        publishedAt: allSucceeded ? now : undefined,
        errorMsg: allSucceeded
          ? null
          : "One or more platforms failed to publish",
      },
    });

    results.push({
      postId: post.id,
      status: allSucceeded ? "published" : "failed",
    });
  }

  return NextResponse.json({
    processed: results.length,
    results,
  });
}

async function publishToplatform(
  platform: string,
  accessToken: string,
  platformId: string,
  content: string,
  mediaUrl?: string
): Promise<Record<string, unknown>> {
  switch (platform) {
    case "facebook":
    case "instagram": {
      const fb = new FacebookClient(accessToken);
      return fb.publishPost(platformId, content, mediaUrl);
    }
    case "twitter": {
      const tw = new TwitterClient(accessToken);
      return tw.publishPost(content, mediaUrl);
    }
    case "linkedin": {
      const li = new LinkedInClient(accessToken);
      return li.publishPost(platformId, content, mediaUrl);
    }
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
