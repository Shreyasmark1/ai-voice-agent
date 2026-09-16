import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { businesses, workflowFields, workflows } from "@/db/schema";
import { verifyToken, type CallTokenPayload } from "@/lib/auth/token";
import { buildSystemPrompt } from "@/lib/agent/prompt";
import { localizeGreetingAndClosing } from "@/lib/agent/localize";
import { DEFAULT_LANGUAGE, DEFAULT_VOICE } from "@/lib/constants";
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

  const language = (payload.language as string) || DEFAULT_LANGUAGE;
  const voice = (payload.voice as string) || DEFAULT_VOICE;

  const localized = await localizeGreetingAndClosing({
    greeting: workflow.greeting || "Hello! How can I help you?",
    closingMessage: workflow.closingMessage,
    language,
  });

  const system = buildSystemPrompt(
    {
      business: row[0].business,
      workflow,
      fields,
    },
    { language, closingMessageOverride: localized.closingMessage, greeting: localized.greeting }
  );

  const availableTools: string[] = [];
  const canUseCalendar = await hasGoogleCalendar(payload.user_id);
  if(canUseCalendar) availableTools.push('calendar')

  return NextResponse.json({
    system,
    language,
    voice,
    greeting: localized.greeting,
    availableTools,
  });
}
