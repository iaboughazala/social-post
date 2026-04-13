import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

const CALLBACK_BASE = `${process.env.NEXTAUTH_URL}/api/accounts/callback`;

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/en/login`
    );
  }

  const { platform } = await params;
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/en/accounts?error=${encodeURIComponent(error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/en/accounts?error=missing_code`
    );
  }

  // Decode state to get teamId
  let stateData: { teamId: string; userId: string };
  try {
    stateData = JSON.parse(
      Buffer.from(state, "base64url").toString("utf-8")
    );
  } catch {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/en/accounts?error=invalid_state`
    );
  }

  try {
    const callbackUrl = `${CALLBACK_BASE}/${platform}`;

    // Exchange code for token
    const tokenData = await exchangeCodeForToken(platform, code, callbackUrl);

    // Fetch profile from the platform
    const profile = await fetchPlatformProfile(platform, tokenData.access_token);

    const { db } = await import("@/lib/db");

    // Upsert social account
    await db.socialAccount.upsert({
      where: {
        platform_platformId: {
          platform,
          platformId: profile.id,
        },
      },
      update: {
        name: profile.name,
        username: profile.username || null,
        avatar: profile.avatar || null,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        expiresAt: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
        isActive: true,
        teamId: stateData.teamId,
      },
      create: {
        platform,
        platformId: profile.id,
        name: profile.name,
        username: profile.username || null,
        avatar: profile.avatar || null,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        expiresAt: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
        teamId: stateData.teamId,
      },
    });

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/en/accounts?success=connected`
    );
  } catch (err) {
    console.error(`OAuth callback error for ${platform}:`, err);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/en/accounts?error=connection_failed`
    );
  }
}

async function exchangeCodeForToken(
  platform: string,
  code: string,
  redirectUri: string
): Promise<TokenResponse> {
  switch (platform) {
    case "facebook": {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?` +
          new URLSearchParams({
            client_id: process.env.FACEBOOK_CLIENT_ID!,
            client_secret: process.env.FACEBOOK_CLIENT_SECRET!,
            redirect_uri: redirectUri,
            code,
          })
      );
      return res.json();
    }

    case "twitter": {
      const credentials = Buffer.from(
        `${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`
      ).toString("base64");
      const res = await fetch("https://api.twitter.com/2/oauth2/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
          code_verifier: "challenge", // In production, retrieve stored verifier
        }),
      });
      return res.json();
    }

    case "linkedin": {
      const res = await fetch(
        "https://www.linkedin.com/oauth/v2/accessToken",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
            client_id: process.env.LINKEDIN_CLIENT_ID!,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
          }),
        }
      );
      return res.json();
    }

    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

async function fetchPlatformProfile(
  platform: string,
  accessToken: string
): Promise<{ id: string; name: string; username?: string; avatar?: string }> {
  switch (platform) {
    case "facebook": {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/me?fields=id,name,picture&access_token=${accessToken}`
      );
      const data = await res.json();
      return {
        id: data.id,
        name: data.name,
        avatar: data.picture?.data?.url,
      };
    }

    case "twitter": {
      const res = await fetch(
        "https://api.twitter.com/2/users/me?user.fields=profile_image_url,username,name",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await res.json();
      return {
        id: data.data.id,
        name: data.data.name,
        username: data.data.username,
        avatar: data.data.profile_image_url,
      };
    }

    case "linkedin": {
      const res = await fetch(
        "https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await res.json();
      const pictureElements =
        data.profilePicture?.["displayImage~"]?.elements || [];
      const avatar =
        pictureElements[pictureElements.length - 1]?.identifiers?.[0]
          ?.identifier || undefined;
      return {
        id: data.id,
        name: `${data.localizedFirstName} ${data.localizedLastName}`,
        avatar,
      };
    }

    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}
