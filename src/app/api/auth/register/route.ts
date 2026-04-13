import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { db } = await import("@/lib/db");
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Auto-create a team and assign the user as owner
    const slug = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-") + "-team";
    const team = await db.team.create({
      data: {
        name: `${name}'s Team`,
        slug,
      },
    });

    await db.teamMember.create({
      data: {
        userId: user.id,
        teamId: team.id,
        role: "OWNER",
      },
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
