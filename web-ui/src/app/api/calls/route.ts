import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/db";
import { businesses, workflows } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { signToken, type CallTokenPayload } from "@/lib/auth/token";

const SECRET = process.env.VOICE_AGENT_SECRET || "";

export async function POST(req: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!SECRET) {
    return NextResponse.json(
      { error: "VOICE_AGENT_SECRET not configured" },
      { status: 500 }
    );
  }

  const { workflowId } = await req.json();
  
  if (!workflowId) {
    return NextResponse.json({ error: "workflowId required" }, { status: 400 });
  }

  // Verify the workflow belongs to this user
  const row = await db
    .select({ workflow: workflows })
    .from(workflows)
    .innerJoin(businesses, eq(businesses.id, workflows.businessId))
    .where(
      and(eq(workflows.id, workflowId), eq(businesses.ownerId, session.user.id))
    )
    .limit(1);

  if (!row[0]) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }

  const wf = row[0].workflow;
  const callId = randomUUID();
  const lang = (wf.language as string) || "en-IN";

  const now = Math.floor(Date.now() / 1000);
  const token = signToken<CallTokenPayload>({
    call_id: callId,
    workflow_id: workflowId,
    user_id: session.user.id,
    language: lang,
    iat: now,
    exp: now + 600, // 10 minutes
  });

  const wsBase = process.env.VOICE_AGENT_URL || "ws://localhost:8765";

  return NextResponse.json({
    callId,
    token,
    wsUrl: `${wsBase}/ws`,
  });
}
