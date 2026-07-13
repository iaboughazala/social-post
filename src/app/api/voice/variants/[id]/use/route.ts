import { NextRequest, NextResponse } from "next/server";
import { getVoiceSession } from "@/lib/voice/session";

export const dynamic = "force-dynamic";

/**
 * Convert a PostVariant into a Post (draft) belonging to the user's team.
 * If the variant already has an attached post, return that post instead of
 * creating a duplicate.
 */
export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const { db } = await import("@/lib/db");

  const variant = await db.postVariant.findFirst({
    where: {
      id,
      generation: { userId: s.userId, teamId: s.teamId },
    },
    include: { generation: true, post: true },
  });
  if (!variant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (variant.post) {
    return NextResponse.json({ postId: variant.post.id, reused: true });
  }

  const post = await db.post.create({
    data: {
      content: variant.content,
      status: "draft",
      teamId: s.teamId,
      authorId: s.userId,
    },
  });

  await db.postVariant.update({
    where: { id: variant.id },
    data: { postId: post.id },
  });

  return NextResponse.json({ postId: post.id, reused: false }, { status: 201 });
}
