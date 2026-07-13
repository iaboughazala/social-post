import { NextRequest, NextResponse } from "next/server";
import { getVoiceSession } from "@/lib/voice/session";

export const dynamic = "force-dynamic";

/**
 * Calendar feed: all team posts falling inside [from, to] ordered by their
 * effective calendar time (publishedAt if present, else scheduledAt).
 *
 * Query params:
 *   from  ISO datetime (inclusive)
 *   to    ISO datetime (exclusive)
 *
 * Returns scheduled + published + failed rows only — drafts have no time
 * and don't belong on a calendar.
 */
export async function GET(req: NextRequest) {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const fromRaw = searchParams.get("from");
  const toRaw = searchParams.get("to");
  const from = fromRaw ? new Date(fromRaw) : null;
  const to = toRaw ? new Date(toRaw) : null;
  if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return NextResponse.json(
      { error: "from and to (ISO datetime) are required" },
      { status: 400 }
    );
  }

  const { db } = await import("@/lib/db");
  const posts = await db.post.findMany({
    where: {
      teamId: s.teamId,
      status: { in: ["scheduled", "publishing", "published", "failed"] },
      OR: [
        { scheduledAt: { gte: from, lt: to } },
        { publishedAt: { gte: from, lt: to } },
      ],
    },
    include: {
      postAccounts: {
        include: { socialAccount: { select: { platform: true } } },
      },
      sourceVariant: { select: { id: true } },
    },
  });

  return NextResponse.json({
    posts: posts.map((p) => ({
      id: p.id,
      content: p.content,
      status: p.status,
      scheduledAt: p.scheduledAt,
      publishedAt: p.publishedAt,
      platforms: Array.from(
        new Set(p.postAccounts.map((pa) => pa.socialAccount.platform))
      ),
      isAI: !!p.sourceVariant,
    })),
  });
}
