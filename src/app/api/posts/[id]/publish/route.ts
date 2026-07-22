import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { publishToPlatform } from "@/lib/social/publish";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const teamId = (session.user as Record<string, unknown>).teamId as string;
  if (!teamId) {
    return NextResponse.json({ error: "No team found" }, { status: 400 });
  }

  const { id: postId } = await ctx.params;
  const { db } = await import("@/lib/db");

  const post = await db.post.findFirst({
    where: { id: postId, teamId },
    include: {
      postAccounts: {
        include: { socialAccount: true },
      },
    },
  });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  if (post.postAccounts.length === 0) {
    return NextResponse.json(
      { error: "No social accounts linked to this post" },
      { status: 400 }
    );
  }

  await db.post.update({
    where: { id: post.id },
    data: { status: "publishing" },
  });

  const mediaUrls = post.mediaUrls
    ? (JSON.parse(post.mediaUrls) as string[])
    : [];
  const firstRaw = mediaUrls[0];
  const firstMedia = firstRaw
    ? (await import("@/lib/images/storage")).absoluteMediaUrl(firstRaw)
    : undefined;

  const results: Array<{
    platform: string;
    status: "published" | "failed";
    platformPostId?: string;
    error?: string;
  }> = [];
  let allSucceeded = true;

  for (const pa of post.postAccounts) {
    const { socialAccount } = pa;
    try {
      const result = await publishToPlatform(
        {
          platform: socialAccount.platform,
          platformId: socialAccount.platformId,
          accessToken: socialAccount.accessToken,
        },
        post.content,
        firstMedia,
        post.id
      );
      const platformPostId =
        (result as { id?: string }).id ||
        (result as { data?: { id?: string } }).data?.id ||
        undefined;
      await db.postAccount.update({
        where: { id: pa.id },
        data: {
          status: "published",
          platformPostId: platformPostId || null,
          errorMsg: null,
        },
      });
      results.push({
        platform: socialAccount.platform,
        status: "published",
        platformPostId,
      });
    } catch (err) {
      allSucceeded = false;
      const msg = err instanceof Error ? err.message : "Unknown error";
      await db.postAccount.update({
        where: { id: pa.id },
        data: { status: "failed", errorMsg: msg },
      });
      results.push({
        platform: socialAccount.platform,
        status: "failed",
        error: msg,
      });
    }
  }

  await db.post.update({
    where: { id: post.id },
    data: {
      status: allSucceeded ? "published" : "failed",
      publishedAt: allSucceeded ? new Date() : undefined,
      errorMsg: allSucceeded ? null : "One or more platforms failed",
    },
  });

  return NextResponse.json({
    postId: post.id,
    status: allSucceeded ? "published" : "failed",
    results,
  });
}
