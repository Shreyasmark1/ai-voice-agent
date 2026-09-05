import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { businesses, workflowFields, workflows } from "@/db/schema";
import { verifyToken, type CallTokenPayload } from "@/lib/auth/token";
import { buildSystemPrompt } from "@/lib/agent/prompt";
import { hasGoogleCalendar } from "@/lib/calendar";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  
  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  const payload = verifyToken<CallTokenPayload>(token);
  
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  const row = await db
    .select({ workflow: workflows, business: businesses })
    .from(workflows)
    .innerJoin(businesses, eq(businesses.id, workflows.businessId))
    .where(
      and(
        eq(workflows.id, payload.workflow_id),
        eq(businesses.ownerId, payload.user_id)
      )
    )
    .limit(1);

  if (!row[0]) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }

  const fields = await db
    .select()
    .from(workflowFields)
    .where(eq(workflowFields.workflowId, payload.workflow_id))
    .orderBy(workflowFields.order);

  const workflow = row[0].workflow;
  
  const system = buildSystemPrompt({
    business: row[0].business,
    workflow,
    fields,
  });

  const availableTools: string[] = [];
  const canUseCalendar = await hasGoogleCalendar(payload.user_id);
  if(canUseCalendar) availableTools.push('calendar')

  return NextResponse.json({
    system,
    language: workflow.language || "en-IN",
    greeting: workflow.greeting || "Hello! How can I help you?",
    availableTools,
  });
}
