import { NextRequest, NextResponse } from "next/server";
import { getVoiceSession } from "@/lib/voice/session";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();

  const { db } = await import("@/lib/db");
  const existing = await db.contentTopic.findFirst({
    where: { id, teamId: s.teamId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") data.title = body.title;
  if (typeof body.description === "string") data.description = body.description;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.order === "number") data.order = body.order;
  if (Array.isArray(body.frameworks)) data.frameworks = JSON.stringify(body.frameworks);
  if (Array.isArray(body.angles)) data.angles = JSON.stringify(body.angles);
  if (Array.isArray(body.hooks)) data.hooks = JSON.stringify(body.hooks);
  if (Array.isArray(body.hashtags)) data.hashtags = JSON.stringify(body.hashtags);

  const topic = await db.contentTopic.update({ where: { id }, data });
  return NextResponse.json({ topic });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const { db } = await import("@/lib/db");
  const existing = await db.contentTopic.findFirst({
    where: { id, teamId: s.teamId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.contentTopic.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
