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
  const existing = await db.narrativeStyle.findFirst({
    where: { id, teamId: s.teamId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.description === "string") data.description = body.description;
  if (typeof body.isActive === "boolean") data.isActive = body.isActive;
  if (typeof body.order === "number") data.order = body.order;

  const narrative = await db.narrativeStyle.update({ where: { id }, data });
  return NextResponse.json({ narrative });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const { db } = await import("@/lib/db");
  const existing = await db.narrativeStyle.findFirst({
    where: { id, teamId: s.teamId },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.narrativeStyle.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
