import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { encryptToken } from "@/lib/crypto";

export const dynamic = "force-dynamic";

const GRAPH_BASE = "https://graph.facebook.com/v19.0";

/**
 * Connect one-or-more Facebook Pages from a single pasted token.
 *
 * Accepts a User Access Token OR a Page Access Token, short-lived or long.
 * Server-side we:
 *   1. Detect the token type via /me?fields=id,name,category (a page returns
 *      a category field, a user does not).
 *   2. If USER token: exchange for a long-lived one (60d) via
 *      /oauth/access_token?grant_type=fb_exchange_token, then /me/accounts
 *      returns non-expiring Page tokens for every page the user admins.
 *      Save all of them.
 *   3. If PAGE token: same exchange upgrades it to non-expiring; save that
 *      one page.
 *
 * Requires FACEBOOK_APP_ID + FACEBOOK_APP_SECRET matching the app that
 * originally minted the token — otherwise the exchange 400s and we fall
 * back to storing whatever token we got.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const teamId = (session.user as Record<string, unknown>).teamId as string;
  if (!teamId) {
    return NextResponse.json({ error: "No team found" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const rawTokenField =
    typeof body.pageToken === "string"
      ? body.pageToken
      : typeof body.token === "string"
        ? body.token
        : "";
  const initialToken = rawTokenField.trim();
  if (!initialToken) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  // 1) Identify what we got
  const meRes = await fetch(
    `${GRAPH_BASE}/me?fields=id,name,category&access_token=${encodeURIComponent(initialToken)}`
  );
  const me = await meRes.json().catch(() => ({}));
  if (!meRes.ok || me.error || !me.id) {
    return NextResponse.json(
      { error: me?.error?.message || "Invalid Facebook token" },
      { status: 400 }
    );
  }
  const isPageToken = typeof me.category === "string" && me.category.length > 0;

  // 2) Try to upgrade to a long-lived token
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  let workingToken = initialToken;
  let exchangeNote: string | undefined;
  if (appId && appSecret) {
    const exchangeUrl =
      `${GRAPH_BASE}/oauth/access_token?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: initialToken,
      });
    const exRes = await fetch(exchangeUrl);
    const ex = await exRes.json().catch(() => ({}));
    if (exRes.ok && ex.access_token) {
      workingToken = ex.access_token as string;
    } else {
      exchangeNote =
        ex?.error?.message ||
        "Token exchange failed — saved the token as-is (may expire sooner).";
      console.warn("[facebook-connect] exchange failed:", exchangeNote);
    }
  } else {
    exchangeNote = "FACEBOOK_APP_ID/SECRET not set — skipping long-lived upgrade.";
  }

  const { db } = await import("@/lib/db");

  type SavedPage = { id: string; name: string; username: string | null };
  const saved: SavedPage[] = [];

  if (isPageToken) {
    // Single page path — the token itself is for this page.
    const p = await fetchPageInfo(me.id, workingToken);
    const acc = await upsertFbPage(db, teamId, p, workingToken);
    saved.push({ id: acc.platformId, name: acc.name, username: acc.username });
  } else {
    // User token path — fetch all pages the user admins and save each.
    const pagesRes = await fetch(
      `${GRAPH_BASE}/me/accounts?fields=id,name,username,picture,access_token&access_token=${encodeURIComponent(workingToken)}`
    );
    const pages = await pagesRes.json().catch(() => ({}));
    if (!pagesRes.ok || pages.error) {
      return NextResponse.json(
        { error: pages?.error?.message || "Could not list pages" },
        { status: 400 }
      );
    }
    const list = Array.isArray(pages.data) ? pages.data : [];
    if (list.length === 0) {
      return NextResponse.json(
        {
          error:
            "This user has no Facebook Pages you administer. Make sure the token includes pages_show_list and pages_manage_posts.",
        },
        { status: 400 }
      );
    }
    for (const page of list) {
      // page.access_token here is already non-expiring when the source user
      // token was long-lived; still, we save it as-is.
      const p = {
        id: page.id as string,
        name: page.name as string,
        username: (page.username as string | undefined) || null,
        avatar: (page.picture?.data?.url as string | undefined) || null,
      };
      const acc = await upsertFbPage(db, teamId, p, page.access_token);
      saved.push({ id: acc.platformId, name: acc.name, username: acc.username });
    }
  }

  return NextResponse.json({
    saved,
    note: exchangeNote,
  });
}

async function fetchPageInfo(pageId: string, token: string) {
  const url = `${GRAPH_BASE}/${pageId}?fields=id,name,username,picture&access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`Page fetch failed: ${data?.error?.message || res.status}`);
  }
  return {
    id: data.id as string,
    name: data.name as string,
    username: (data.username as string | undefined) || null,
    avatar: (data.picture?.data?.url as string | undefined) || null,
  };
}

async function upsertFbPage(
  db: Awaited<ReturnType<typeof getDbType>>,
  teamId: string,
  page: { id: string; name: string; username: string | null; avatar: string | null },
  pageToken: string
) {
  return db.socialAccount.upsert({
    where: {
      platform_platformId: { platform: "facebook", platformId: page.id },
    },
    create: {
      platform: "facebook",
      platformId: page.id,
      name: page.name,
      username: page.username ? `@${page.username}` : null,
      avatar: page.avatar,
      accessToken: encryptToken(pageToken),
      refreshToken: null,
      expiresAt: null,
      teamId,
      isActive: true,
    },
    update: {
      name: page.name,
      username: page.username ? `@${page.username}` : null,
      avatar: page.avatar,
      accessToken: encryptToken(pageToken),
      refreshToken: null,
      expiresAt: null,
      teamId,
      isActive: true,
    },
  });
}

// Just to give the second param above a real type without importing @prisma/client at top level (kept lazy for build parity).
async function getDbType() {
  const mod = await import("@/lib/db");
  return mod.db;
}
