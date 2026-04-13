import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = (session.user as any).teamId;

  if (!teamId) {
    return NextResponse.json({ error: "No team found" }, { status: 400 });
  }

  try {
    const { db } = await import("@/lib/db");

    const team = await db.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { role: "asc" },
        },
        subscription: {
          select: { plan: true, status: true },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: team.id,
      name: team.name,
      slug: team.slug,
      plan: team.plan,
      subscription: team.subscription,
      members: team.members.map((m: any) => ({
        id: m.id,
        role: m.role,
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        image: m.user.image,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch team:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = (session.user as any).teamId;
  const teamRole = (session.user as any).teamRole;

  if (!teamId) {
    return NextResponse.json({ error: "No team found" }, { status: 400 });
  }

  // Only owners and admins can invite members
  if (teamRole !== "owner" && teamRole !== "admin") {
    return NextResponse.json(
      { error: "Only owners and admins can invite members" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { email, role } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const validRoles = ["admin", "editor", "viewer"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be admin, editor, or viewer" },
        { status: 400 }
      );
    }

    const { db } = await import("@/lib/db");

    // Find or create the user
    let user = await db.user.findUnique({ where: { email } });

    if (!user) {
      // Create a placeholder user that can be claimed later
      user = await db.user.create({
        data: {
          email,
          name: email.split("@")[0],
        },
      });
    }

    // Check if already a member
    const existingMember = await db.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: user.id,
          teamId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a team member" },
        { status: 409 }
      );
    }

    const member = await db.teamMember.create({
      data: {
        userId: user.id,
        teamId,
        role,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    });

    return NextResponse.json(
      {
        id: member.id,
        role: member.role,
        userId: member.userId,
        name: member.user.name,
        email: member.user.email,
        image: member.user.image,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to invite member:", error);
    return NextResponse.json(
      { error: "Failed to invite member" },
      { status: 500 }
    );
  }
}
