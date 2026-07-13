import { NextRequest, NextResponse } from "next/server";
import { getVoiceSession } from "@/lib/voice/session";
import { WEEKDAY_KEYS } from "@/lib/voice/schedule";
import { reslotTeam } from "@/lib/voice/reslot";

export const dynamic = "force-dynamic";

const PLATFORM_KEYS = ["linkedin", "twitter", "facebook", "instagram"];

export async function GET() {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { db } = await import("@/lib/db");
  const schedule = await db.publishingSchedule.findUnique({
    where: { teamId: s.teamId },
  });
  return NextResponse.json({ schedule });
}

export async function PUT(req: NextRequest) {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const daysRaw = Array.isArray(body.days) ? body.days.map(String) : [];
  const timesRaw = Array.isArray(body.times) ? body.times.map(String) : [];
  const platformsRaw = Array.isArray(body.platforms) ? body.platforms.map(String) : [];

  const days = daysRaw.filter((d: string) => (WEEKDAY_KEYS as readonly string[]).includes(d));
  const times = timesRaw.filter((t: string) => /^\d{2}:\d{2}$/.test(t));
  const platforms = platformsRaw.filter((p: string) => PLATFORM_KEYS.includes(p));
  const timezone = typeof body.timezone === "string" && body.timezone.trim()
    ? body.timezone.trim()
    : "Asia/Riyadh";
  const isActive = typeof body.isActive === "boolean" ? body.isActive : true;

  const { db } = await import("@/lib/db");
  const schedule = await db.publishingSchedule.upsert({
    where: { teamId: s.teamId },
    create: {
      teamId: s.teamId,
      days: JSON.stringify(days),
      times: JSON.stringify(times),
      platforms: JSON.stringify(platforms),
      timezone,
      isActive,
    },
    update: {
      days: JSON.stringify(days),
      times: JSON.stringify(times),
      platforms: JSON.stringify(platforms),
      timezone,
      isActive,
    },
  });

  const reslot = await reslotTeam(s.teamId);
  return NextResponse.json({ schedule, reslot });
}
