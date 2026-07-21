import { NextRequest, NextResponse } from "next/server";
import { getVoiceSession } from "@/lib/voice/session";

export const dynamic = "force-dynamic";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function GET() {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { db } = await import("@/lib/db");
  const narratives = await db.narrativeStyle.findMany({
    where: { teamId: s.teamId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ narratives });
}

export async function POST(req: NextRequest) {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { slug: rawSlug, name, description, order, isActive } = body ?? {};

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const slug = (typeof rawSlug === "string" && rawSlug.trim()) || slugify(name);

  const { db } = await import("@/lib/db");
  const narrative = await db.narrativeStyle.create({
    data: {
      teamId: s.teamId,
      slug,
      name,
      description: description ?? "",
      order: typeof order === "number" ? order : 0,
      isActive: typeof isActive === "boolean" ? isActive : true,
    },
  });
  return NextResponse.json({ narrative }, { status: 201 });
}
