import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { auth } from "@/auth";
import { db } from "@/db";
import { googleCalendarAccounts } from "@/db/schema";
import { encryptToken } from "@/lib/calendar/encrypt";
import { GOOGLE_OAUTH_TOKEN_URL } from "@/lib/constants";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const storedState = cookieStore.get("google_oauth_state")?.value;

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(new URL("/app/calendar?error=oauth", req.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const baseUrl = process.env.NEXTAUTH_URL || url.origin;
  const redirectUri = `${baseUrl}/api/auth/google/callback`;
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Google OAuth not configured" },
      { status: 500 }
    );
  }

  let tokenData: {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope?: string;
  };
  try {
    const res = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });
    if (!res.ok) {
      throw new Error(`Token exchange failed (${res.status})`);
    }
    tokenData = (await res.json()) as typeof tokenData;
    if (!tokenData.refresh_token) {
      throw new Error("No refresh token returned");
    }
  } catch {
    return NextResponse.redirect(
      new URL("/app/calendar?error=token", req.url)
    );
  }

  // Persist the connection with the refresh token encrypted at rest.
  await db
    .insert(googleCalendarAccounts)
    .values({
      userId: session.user.id,
      refreshToken: encryptToken(tokenData.refresh_token),
      accessToken: tokenData.access_token,
      tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      scopes: tokenData.scope,
      calendarId: "primary",
    })
    .onConflictDoUpdate({
      target: googleCalendarAccounts.userId,
      set: {
        refreshToken: encryptToken(tokenData.refresh_token),
        accessToken: tokenData.access_token,
        tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        scopes: tokenData.scope,
        calendarId: "primary",
        updatedAt: new Date(),
      },
    });

  cookieStore.delete("google_oauth_state");
  return NextResponse.redirect(
    new URL("/app/calendar?connected=1", req.url)
  );
}