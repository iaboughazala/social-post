import { NextRequest, NextResponse } from "next/server";
import { encryptToken } from "@/lib/crypto";

export const dynamic = "force-dynamic";

const TOKEN_URL = "https://api.x.com/2/oauth2/token";
const ME_URL = "https://api.x.com/2/users/me?user.fields=profile_image_url,username,name";

function errorRedirect(baseUrl: string, code: string) {
  return NextResponse.redirect(`${baseUrl}/en/accounts?error=${code}`);
}

export async function GET(req: NextRequest) {
  const nextAuthUrl = process.env.NEXTAUTH_URL || "";
  const { searchParams } = req.nextUrl;

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const xError = searchParams.get("error");

  if (xError) {
    return errorRedirect(nextAuthUrl, `twitter_${xError}`);
  }

  const stateCookie = req.cookies.get("twitter_oauth_state")?.value;
  const codeVerifier = req.cookies.get("twitter_oauth_verifier")?.value;
  const teamId = req.cookies.get("twitter_oauth_team")?.value;

  if (!code || !state || !stateCookie || state !== stateCookie) {
    return errorRedirect(nextAuthUrl, "state_mismatch");
  }
  if (!codeVerifier) {
    return errorRedirect(nextAuthUrl, "verifier_missing");
  }
  if (!teamId) {
    return errorRedirect(nextAuthUrl, "no_team");
  }

  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return errorRedirect(nextAuthUrl, "not_configured");
  }

  const redirectUri = `${nextAuthUrl}/api/accounts/callback/twitter`;

  // Confidential clients: Basic auth header. Public clients: send client_id in body only.
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
      client_id: clientId,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    console.error("Twitter token exchange failed:", tokenData);
    return errorRedirect(nextAuthUrl, "token_exchange_failed");
  }

  const accessToken = tokenData.access_token as string;
  const refreshToken = (tokenData.refresh_token as string) || null;
  const expiresIn = (tokenData.expires_in as number) || 0;
  const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

  // Get user info
  const meRes = await fetch(ME_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const meData = await meRes.json();
  if (!meRes.ok || !meData.data?.id) {
    console.error("Twitter /users/me failed:", meData);
    return errorRedirect(nextAuthUrl, "userinfo_failed");
  }

  const platformId = meData.data.id as string;
  const displayName = (meData.data.name as string) || "X User";
  const username = meData.data.username ? `@${meData.data.username}` : null;
  const avatar = (meData.data.profile_image_url as string) || null;

  const { db } = await import("@/lib/db");

  await db.socialAccount.upsert({
    where: {
      platform_platformId: {
        platform: "twitter",
        platformId,
      },
    },
    create: {
      platform: "twitter",
      platformId,
      name: displayName,
      username,
      avatar,
      accessToken: encryptToken(accessToken),
      refreshToken: refreshToken ? encryptToken(refreshToken) : null,
      expiresAt,
      teamId,
      isActive: true,
    },
    update: {
      name: displayName,
      username,
      avatar,
      accessToken: encryptToken(accessToken),
      refreshToken: refreshToken ? encryptToken(refreshToken) : null,
      expiresAt,
      teamId,
      isActive: true,
    },
  });

  const res = NextResponse.redirect(`${nextAuthUrl}/en/accounts?connected=twitter`);
  res.cookies.delete("twitter_oauth_state");
  res.cookies.delete("twitter_oauth_verifier");
  res.cookies.delete("twitter_oauth_team");
  return res;
}
