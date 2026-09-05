import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { auth } from "@/auth";
import { GOOGLE_CALENDAR_SCOPE, GOOGLE_OAUTH_AUTH_URL } from "@/lib/constants";

export const runtime = "nodejs";

const SCOPES = [GOOGLE_CALENDAR_SCOPE].join(" ");

function googleAuthUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${GOOGLE_OAUTH_AUTH_URL}?${params.toString()}`;
}

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "Google OAuth not configured" },
      { status: 500 }
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL || new URL(req.url).origin;
  const redirectUri = `${baseUrl}/api/auth/google/callback`;
  const state = randomBytes(16).toString("hex");

  // Store the state in a signed cookie so the callback can verify it.
  const cookieStore = await cookies();
  cookieStore.set("google_oauth_state", state, {
    httpOnly: true,
    secure: baseUrl.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  return NextResponse.redirect(googleAuthUrl(state, redirectUri));
}
