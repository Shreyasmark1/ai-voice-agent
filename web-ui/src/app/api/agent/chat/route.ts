import { convertToModelMessages, createUIMessageStreamResponse, isStepCount, streamText, toUIMessageStream } from "ai";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { businesses, workflowFields, workflows } from "@/db/schema";
import { auth } from "@/auth";
import { buildSystemPrompt } from "@/lib/agent/prompt";
import { localizeGreetingAndClosing } from "@/lib/agent/localize";
import { DEFAULT_LANGUAGE } from "@/lib/constants";
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

  const { messages, workflowId, language: requestedLanguage } = await req.json();

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

  const language = (requestedLanguage as string) || DEFAULT_LANGUAGE;

  const localized = await localizeGreetingAndClosing({
    greeting: found.workflow.greeting || "Hello! How can I help you?",
    closingMessage: found.workflow.closingMessage,
    language,
  });

  const system = buildSystemPrompt(
    {
      business: found.business,
      workflow: found.workflow,
      fields,
    },
    { language, closingMessageOverride: localized.closingMessage, greeting: localized.greeting }
  );

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