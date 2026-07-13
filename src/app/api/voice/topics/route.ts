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
  const topics = await db.contentTopic.findMany({
    where: { teamId: s.teamId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ topics });
}

export async function POST(req: NextRequest) {
  const s = await getVoiceSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    slug: rawSlug,
    title,
    description,
    frameworks,
    angles,
    hooks,
    hashtags,
    order,
    isActive,
  } = body ?? {};

  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const slug = (typeof rawSlug === "string" && rawSlug.trim()) || slugify(title);

  const { db } = await import("@/lib/db");
  const topic = await db.contentTopic.create({
    data: {
      teamId: s.teamId,
      slug,
      title,
      description: description ?? "",
      frameworks: JSON.stringify(Array.isArray(frameworks) ? frameworks : []),
      angles: JSON.stringify(Array.isArray(angles) ? angles : []),
      hooks: JSON.stringify(Array.isArray(hooks) ? hooks : []),
      hashtags: JSON.stringify(Array.isArray(hashtags) ? hashtags : []),
      order: typeof order === "number" ? order : 0,
      isActive: typeof isActive === "boolean" ? isActive : true,
    },
  });
  return NextResponse.json({ topic }, { status: 201 });
}
