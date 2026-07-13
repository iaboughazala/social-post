import { NextRequest, NextResponse } from "next/server";
import { getVoiceSession } from "@/lib/voice/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { db } = await import("@/lib/db");
  const samples = await db.samplePost.findMany({
    where: { userId: s.userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ samples });
}

export async function POST(req: NextRequest) {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { content, notes } = body ?? {};
  if (!content || typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const { db } = await import("@/lib/db");
  const sample = await db.samplePost.create({
    data: {
      userId: s.userId,
      content: content.trim(),
      notes: typeof notes === "string" ? notes : null,
    },
  });
  return NextResponse.json({ sample }, { status: 201 });
}
