import { NextResponse } from "next/server";
import { getVoiceSession } from "@/lib/voice/session";

export const dynamic = "force-dynamic";

/**
 * Next scheduled posts for the team (drafts that have been approved).
 * Ordered chronologically — oldest scheduled slot first.
 */
export async function GET() {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { db } = await import("@/lib/db");
  const posts = await db.post.findMany({
    where: {
      teamId: s.teamId,
      status: "scheduled",
      scheduledAt: { not: null },
    },
    orderBy: { scheduledAt: "asc" },
    include: {
      postAccounts: {
        include: {
          socialAccount: { select: { platform: true } },
        },
      },
      sourceVariant: {
        include: {
          generation: { include: { topic: { select: { title: true } } } },
        },
      },
    },
    take: 30,
  });

  return NextResponse.json({
    posts: posts.map((p) => ({
      id: p.id,
      content: p.content,
      scheduledAt: p.scheduledAt,
      platforms: Array.from(
        new Set(p.postAccounts.map((pa) => pa.socialAccount.platform))
      ),
      topic: p.sourceVariant?.generation.topic?.title ?? null,
    })),
  });
}
