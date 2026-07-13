import { NextResponse } from "next/server";
import { getVoiceSession } from "@/lib/voice/session";

export const dynamic = "force-dynamic";

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/**
 * Publishing analytics from the DB — no external API calls (engagement stats
 * from LinkedIn/X/etc. would require extra OAuth scopes + review).
 * Team-scoped.
 */
export async function GET() {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { db } = await import("@/lib/db");
  const teamScope = { teamId: s.teamId };

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const twelveWeeksAgo = new Date(now);
  twelveWeeksAgo.setDate(now.getDate() - 12 * 7);

  const [
    totalPublished,
    publishedThisMonth,
    publishedThisWeek,
    failedCount,
    aiPublished,
    manualPublished,
    publishedInWindow,
    platformRows,
    recentPublished,
  ] = await Promise.all([
    db.post.count({ where: { ...teamScope, status: "published" } }),
    db.post.count({
      where: { ...teamScope, status: "published", publishedAt: { gte: startOfMonth } },
    }),
    db.post.count({
      where: { ...teamScope, status: "published", publishedAt: { gte: startOfWeek } },
    }),
    db.post.count({ where: { ...teamScope, status: "failed" } }),
    db.post.count({
      where: {
        ...teamScope,
        status: "published",
        sourceVariant: { isNot: null },
      },
    }),
    db.post.count({
      where: {
        ...teamScope,
        status: "published",
        sourceVariant: null,
      },
    }),
    db.post.findMany({
      where: {
        ...teamScope,
        status: "published",
        publishedAt: { gte: twelveWeeksAgo },
      },
      select: { publishedAt: true },
    }),
    db.postAccount.findMany({
      where: {
        post: { teamId: s.teamId, status: "published" },
        status: "published",
      },
      select: { socialAccount: { select: { platform: true } } },
    }),
    db.post.findMany({
      where: { ...teamScope, status: "published" },
      orderBy: { publishedAt: "desc" },
      take: 10,
      include: {
        postAccounts: {
          include: { socialAccount: { select: { platform: true } } },
        },
        sourceVariant: { select: { id: true } },
      },
    }),
  ]);

  // Weekly activity buckets — last 12 ISO-ish weeks (Sun-anchored)
  const weeks: Array<{ start: Date; label: string; count: number }> = [];
  for (let i = 11; i >= 0; i--) {
    const start = new Date(startOfWeek);
    start.setDate(start.getDate() - i * 7);
    const label = `${start.getMonth() + 1}/${start.getDate()}`;
    weeks.push({ start, label, count: 0 });
  }
  for (const p of publishedInWindow) {
    if (!p.publishedAt) continue;
    const t = p.publishedAt.getTime();
    for (let i = weeks.length - 1; i >= 0; i--) {
      if (t >= weeks[i].start.getTime()) {
        weeks[i].count++;
        break;
      }
    }
  }

  // Weekday distribution across ALL published posts
  const weekdayCounts: Record<string, number> = {
    sun: 0, mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0,
  };
  for (const p of publishedInWindow) {
    if (!p.publishedAt) continue;
    const key = WEEKDAY_KEYS[p.publishedAt.getDay()];
    weekdayCounts[key]++;
  }

  // Platform breakdown from postAccount join
  const platformCounts: Record<string, number> = {};
  for (const row of platformRows) {
    const key = row.socialAccount.platform;
    platformCounts[key] = (platformCounts[key] ?? 0) + 1;
  }

  const totalOutcomes = totalPublished + failedCount;
  const successRate = totalOutcomes === 0 ? 1 : totalPublished / totalOutcomes;

  return NextResponse.json({
    stats: {
      totalPublished,
      publishedThisMonth,
      publishedThisWeek,
      failed: failedCount,
      successRate,
      ai: aiPublished,
      manual: manualPublished,
    },
    activity: weeks.map((w) => ({ label: w.label, count: w.count })),
    platformBreakdown: Object.entries(platformCounts).map(([platform, count]) => ({
      platform,
      count,
    })),
    weekdayBreakdown: WEEKDAY_KEYS.map((k) => ({
      weekday: k,
      count: weekdayCounts[k],
    })),
    recentPublished: recentPublished.map((p) => ({
      id: p.id,
      content: p.content,
      publishedAt: p.publishedAt,
      platforms: Array.from(
        new Set(p.postAccounts.map((pa) => pa.socialAccount.platform))
      ),
      isAI: !!p.sourceVariant,
    })),
  });
}
