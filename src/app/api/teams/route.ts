import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || `brand-${Date.now().toString(36)}`;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as Record<string, unknown>).id as string;
  const activeTeamId = (session.user as Record<string, unknown>).teamId as string | undefined;

  const { db } = await import("@/lib/db");
  const memberships = await db.teamMember.findMany({
    where: { userId },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          _count: {
            select: {
              socialAccounts: true,
              posts: true,
              contentTopics: true,
            },
          },
        },
      },
    },
    orderBy: { id: "asc" },
  });

  return NextResponse.json({
    activeTeamId,
    teams: memberships.map((m) => ({
      ...m.team,
      role: m.role,
      isActive: m.teamId === activeTeamId,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as Record<string, unknown>).id as string;

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const baseSlug =
    (typeof body.slug === "string" && body.slug.trim() && slugify(body.slug)) ||
    slugify(name);

  const { db } = await import("@/lib/db");

  // Ensure slug is globally unique — append -n if needed.
  let slug = baseSlug;
  for (let i = 2; i < 50; i++) {
    const existing = await db.team.findUnique({ where: { slug } });
    if (!existing) break;
    slug = `${baseSlug}-${i}`;
  }

  const team = await db.team.create({
    data: {
      name,
      slug,
      members: {
        create: { userId, role: "owner" },
      },
    },
  });

  // Newly-created teams become the active team automatically.
  await db.user.update({
    where: { id: userId },
    data: { activeTeamId: team.id },
  });

  return NextResponse.json({ team }, { status: 201 });
}
