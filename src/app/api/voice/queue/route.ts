import { NextResponse } from "next/server";
import { getVoiceSession } from "@/lib/voice/session";

export const dynamic = "force-dynamic";

/**
 * Voice review queue: AI-originated posts still in draft.
 * Ordered oldest-first so the reviewer works through the backlog fairly.
 * Also returns aggregate counts across the AI-post pipeline.
 */
export async function GET() {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { db } = await import("@/lib/db");
  const aiScope = { teamId: s.teamId, sourceVariant: { isNot: null } };

  const [posts, draftCount, scheduledCount, publishedCount] = await Promise.all([
    db.post.findMany({
      where: { ...aiScope, status: "draft" },
      orderBy: { createdAt: "asc" },
      include: {
        sourceVariant: {
          include: { generation: { include: { topic: true } } },
        },
      },
    }),
    db.post.count({ where: { ...aiScope, status: "draft" } }),
    db.post.count({ where: { ...aiScope, status: "scheduled" } }),
    db.post.count({ where: { ...aiScope, status: "published" } }),
  ]);

  return NextResponse.json({
    stats: {
      queue: draftCount,
      scheduled: scheduledCount,
      published: publishedCount,
    },
    posts: posts.map((p) => ({
      id: p.id,
      content: p.content,
      createdAt: p.createdAt,
      topic: p.sourceVariant?.generation.topic
        ? {
            id: p.sourceVariant.generation.topic.id,
            title: p.sourceVariant.generation.topic.title,
          }
        : null,
    })),
  });
}
