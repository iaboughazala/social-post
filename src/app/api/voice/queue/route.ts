import { NextResponse } from "next/server";
import { getVoiceSession } from "@/lib/voice/session";

export const dynamic = "force-dynamic";

/**
 * Voice review queue: AI-originated posts still in draft.
 * Ordered oldest-first so the reviewer works through the backlog fairly.
 */
export async function GET() {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { db } = await import("@/lib/db");
  const posts = await db.post.findMany({
    where: {
      teamId: s.teamId,
      status: "draft",
      sourceVariant: { isNot: null },
    },
    orderBy: { createdAt: "asc" },
    include: {
      sourceVariant: {
        include: { generation: { include: { topic: true } } },
      },
    },
  });

  return NextResponse.json({
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
