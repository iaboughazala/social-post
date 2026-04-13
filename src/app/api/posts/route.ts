import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const status = searchParams.get("status");

  const teamId = (session.user as any).teamId;

  if (!teamId) {
    return NextResponse.json({ error: "No team found" }, { status: 400 });
  }

  try {
    const { db } = await import("@/lib/db");

    const where: any = { teamId };
    if (status && status !== "all") {
      where.status = status;
    }

    const [posts, total] = await Promise.all([
      db.post.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: {
            select: { id: true, name: true, email: true, image: true },
          },
          postAccounts: {
            include: {
              socialAccount: {
                select: { id: true, platform: true, name: true },
              },
            },
          },
        },
      }),
      db.post.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
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
  const userId = (session.user as any).id;

  if (!teamId) {
    return NextResponse.json({ error: "No team found" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { content, mediaUrls, platforms, scheduledAt, status } = body;

    if (!content || !platforms?.length) {
      return NextResponse.json(
        { error: "Content and at least one platform are required" },
        { status: 400 }
      );
    }

    const { db } = await import("@/lib/db");

    const post = await db.post.create({
      data: {
        content,
        mediaUrls: mediaUrls ? JSON.stringify(mediaUrls) : null,
        status: status || "draft",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        teamId,
        authorId: userId,
      },
    });

    // Link post to social accounts for each platform
    if (platforms.length > 0) {
      const socialAccounts = await db.socialAccount.findMany({
        where: {
          teamId,
          platform: { in: platforms },
          isActive: true,
        },
      });

      if (socialAccounts.length > 0) {
        await db.postAccount.createMany({
          data: socialAccounts.map((account: any) => ({
            postId: post.id,
            socialAccountId: account.id,
          })),
        });
      }
    }

    const createdPost = await db.post.findUnique({
      where: { id: post.id },
      include: {
        author: {
          select: { id: true, name: true, email: true, image: true },
        },
        postAccounts: {
          include: {
            socialAccount: {
              select: { id: true, platform: true, name: true },
            },
          },
        },
      },
    });

    return NextResponse.json(createdPost, { status: 201 });
  } catch (error) {
    console.error("Failed to create post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
