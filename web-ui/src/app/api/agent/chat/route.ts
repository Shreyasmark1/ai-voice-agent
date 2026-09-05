import { convertToModelMessages, createUIMessageStreamResponse, isStepCount, streamText, toUIMessageStream, type UIMessage } from "ai";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { businesses, workflowFields, workflows } from "@/db/schema";
import { auth } from "@/auth";
import { buildSystemPrompt } from "@/lib/agent/prompt";
import { getCalendarServiceForUser } from "@/lib/calendar";
import { getTools } from "@/lib/tools";
import { getModel } from "@/lib/agent/model";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { messages, workflowId }: { messages: UIMessage[]; workflowId: string } = await req.json();

  if (!workflowId || !Array.isArray(messages)) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const row = await db
    .select({
      workflow: workflows,
      business: businesses,
    })
    .from(workflows)
    .innerJoin(businesses, eq(businesses.id, workflows.businessId))
    .where(and(eq(workflows.id, workflowId), eq(businesses.ownerId, session.user.id)))
    .limit(1);

  const found = row[0];
  
  if (!found) return Response.json({ error: "Workflow not found" }, { status: 404 });

  const fields = await db
    .select()
    .from(workflowFields)
    .where(eq(workflowFields.workflowId, workflowId))
    .orderBy(workflowFields.order);

  const system = buildSystemPrompt({
    business: found.business,
    workflow: found.workflow,
    fields,
  });

  const calendar = await getCalendarServiceForUser(session.user.id);
  
  const result = streamText({
    model: getModel(),
    system,
    messages: await convertToModelMessages(messages),
    stopWhen: isStepCount(20),
    tools: getTools({ calendar }),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
} 