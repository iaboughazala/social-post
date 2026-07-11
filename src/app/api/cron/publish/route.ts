import { NextRequest, NextResponse } from "next/server";
import { publishToPlatform } from "@/lib/social/publish";

export const dynamic = "force-dynamic";

const MAX_RETRIES = 3;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { db } = await import("@/lib/db");

  const now = new Date();
  const posts = await db.post.findMany({
    where: {
      status: "scheduled",
      scheduledAt: { lte: now },
    },
    include: {
      postAccounts: {
        include: { socialAccount: true },
      },
    },
  });

  const results: Array<{ postId: string; status: string }> = [];

  for (const post of posts) {
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
          const result = await publishToPlatform(
            {
              platform: socialAccount.platform,
              platformId: socialAccount.platformId,
              accessToken: socialAccount.accessToken,
            },
            post.content,
            firstMedia
          );
          platformPostId =
            (result as { id?: string }).id ||
            (result as { data?: { id?: string } }).data?.id ||
            undefined;
          success = true;
        } catch (err) {
          lastError =
            err instanceof Error ? err.message : "Unknown error occurred";
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

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
