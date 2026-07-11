import { NextRequest, NextResponse } from "next/server";
import { encryptToken } from "@/lib/crypto";

export const dynamic = "force-dynamic";

const GRAPH_BASE = "https://graph.facebook.com/v19.0";

function errorRedirect(baseUrl: string, code: string) {
  return NextResponse.redirect(`${baseUrl}/en/accounts?error=${code}`);
}

interface FbPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  username?: string;
}

export async function GET(req: NextRequest) {
  const nextAuthUrl = process.env.NEXTAUTH_URL || "";
  const { searchParams } = req.nextUrl;

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const fbError = searchParams.get("error");

  if (fbError) {
    return errorRedirect(nextAuthUrl, `facebook_${fbError}`);
  }

  const stateCookie = req.cookies.get("fb_oauth_state")?.value;
  const teamId = req.cookies.get("fb_oauth_team")?.value;

  if (!code || !state || !stateCookie || state !== stateCookie) {
    return errorRedirect(nextAuthUrl, "state_mismatch");
  }
  if (!teamId) {
    return errorRedirect(nextAuthUrl, "no_team");
  }

  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  if (!appId || !appSecret) {
    return errorRedirect(nextAuthUrl, "not_configured");
  }

  const redirectUri = `${nextAuthUrl}/api/accounts/callback/facebook`;

  // 1) Exchange code -> short-lived user token
  const shortTokenParams = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });
  const shortRes = await fetch(
    `${GRAPH_BASE}/oauth/access_token?${shortTokenParams.toString()}`
  );
  const shortData = await shortRes.json();
  if (!shortRes.ok || !shortData.access_token) {
    console.error("FB short token failed:", shortData);
    return errorRedirect(nextAuthUrl, "token_exchange_failed");
  }
  const shortLived = shortData.access_token as string;

  // 2) Exchange short-lived -> long-lived (~60 days) user token
  const longParams = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortLived,
  });
  const longRes = await fetch(
    `${GRAPH_BASE}/oauth/access_token?${longParams.toString()}`
  );
  const longData = await longRes.json();
  if (!longRes.ok || !longData.access_token) {
    console.error("FB long-lived exchange failed:", longData);
    return errorRedirect(nextAuthUrl, "long_token_failed");
  }
  const longLived = longData.access_token as string;
  const userExpiresIn = (longData.expires_in as number) || 60 * 24 * 3600;

  // 3) Fetch pages the user manages (their page tokens are effectively non-expiring
  //    when derived from a long-lived user token)
  const pagesRes = await fetch(
    `${GRAPH_BASE}/me/accounts?fields=id,name,username,category,access_token&access_token=${encodeURIComponent(longLived)}`
  );
  const pagesData = await pagesRes.json();
  if (!pagesRes.ok || !Array.isArray(pagesData.data)) {
    console.error("FB /me/accounts failed:", pagesData);
    return errorRedirect(nextAuthUrl, "pages_fetch_failed");
  }
  const pages = pagesData.data as FbPage[];

  if (pages.length === 0) {
    return errorRedirect(nextAuthUrl, "no_pages_found");
  }

  const { db } = await import("@/lib/db");

  // Persist each page as a SocialAccount
  const userExpiresAt = new Date(Date.now() + userExpiresIn * 1000);
  for (const page of pages) {
    // Try to fetch avatar
    let avatar: string | null = null;
    try {
      const picRes = await fetch(
        `${GRAPH_BASE}/${page.id}/picture?redirect=false&type=large&access_token=${encodeURIComponent(page.access_token)}`
      );
      const picData = await picRes.json();
      avatar = picData?.data?.url || null;
    } catch {
      // ignore
    }

    await db.socialAccount.upsert({
      where: {
        platform_platformId: {
          platform: "facebook",
          platformId: page.id,
        },
      },
      create: {
        platform: "facebook",
        platformId: page.id,
        name: page.name,
        username: page.username ? `@${page.username}` : null,
        avatar,
        accessToken: encryptToken(page.access_token),
        refreshToken: null,
        expiresAt: userExpiresAt,
        teamId,
        isActive: true,
      },
      update: {
        name: page.name,
        username: page.username ? `@${page.username}` : null,
        avatar,
        accessToken: encryptToken(page.access_token),
        refreshToken: null,
        expiresAt: userExpiresAt,
        teamId,
        isActive: true,
      },
    });
  }

  const res = NextResponse.redirect(
    `${nextAuthUrl}/en/accounts?connected=facebook&pages=${pages.length}`
  );
  res.cookies.delete("fb_oauth_state");
  res.cookies.delete("fb_oauth_team");
  return res;
}
