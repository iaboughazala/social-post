import { NextResponse } from "next/server";
import { getVoiceSession } from "@/lib/voice/session";

export const dynamic = "force-dynamic";

/**
 * Aggregated dashboard payload — one round trip, everything the landing page needs.
 * Team-scoped. Voice-queue count is scoped to AI-originated drafts only.
 */
export async function GET() {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { db } = await import("@/lib/db");
  const teamScope = { teamId: s.teamId };

  const [
    totalPosts,
    scheduledCount,
    publishedCount,
    draftCount,
    failedCount,
    connectedAccounts,
    voiceQueueCount,
    upcoming,
    recentlyPublished,
  ] = await Promise.all([
    db.post.count({ where: teamScope }),
    db.post.count({ where: { ...teamScope, status: "scheduled" } }),
    db.post.count({ where: { ...teamScope, status: "published" } }),
    db.post.count({ where: { ...teamScope, status: "draft" } }),
    db.post.count({ where: { ...teamScope, status: "failed" } }),
    db.socialAccount.count({ where: { ...teamScope, isActive: true } }),
    db.post.count({
      where: { ...teamScope, status: "draft", sourceVariant: { isNot: null } },
    }),
    db.post.findMany({
      where: {
        ...teamScope,
        status: "scheduled",
        scheduledAt: { not: null, gte: new Date() },
      },
      orderBy: { scheduledAt: "asc" },
      take: 5,
      include: {
        postAccounts: {
          include: { socialAccount: { select: { platform: true } } },
        },
        sourceVariant: { select: { id: true } },
      },
    }),
    db.post.findMany({
      where: {
        ...teamScope,
        status: "published",
      },
      orderBy: { publishedAt: "desc" },
      take: 5,
      include: {
        postAccounts: {
          include: { socialAccount: { select: { platform: true } } },
        },
        sourceVariant: { select: { id: true } },
      },
    }),
  ]);

  function mapPost(p: {
    id: string;
    content: string;
    mediaUrls: string | null;
    scheduledAt: Date | null;
    publishedAt: Date | null;
    postAccounts: { socialAccount: { platform: string } }[];
    sourceVariant: { id: string } | null;
  }) {
    return {
      id: p.id,
      content: p.content,
      mediaUrls: p.mediaUrls,
      scheduledAt: p.scheduledAt,
      publishedAt: p.publishedAt,
      platforms: Array.from(
        new Set(p.postAccounts.map((pa) => pa.socialAccount.platform))
      ),
      isAI: !!p.sourceVariant,
    };
  }

  return NextResponse.json({
    stats: {
      totalPosts,
      scheduled: scheduledCount,
      published: publishedCount,
      drafts: draftCount,
      failed: failedCount,
      connectedAccounts,
      voiceQueue: voiceQueueCount,
    },
    upcoming: upcoming.map(mapPost),
    recentlyPublished: recentlyPublished.map(mapPost),
  });
}
