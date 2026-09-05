import { NextResponse } from "next/server";
import { z } from "zod";

import type { ToolSet } from "ai";
import { verifyToken, type CallTokenPayload } from "@/lib/auth/token";
import { getCalendarServiceForUser } from "@/lib/calendar";
import { getTools } from "@/lib/tools";

export const runtime = "nodejs";
export const maxDuration = 30;

const bodySchema = z.object({
  token: z.string().min(1),
  tool: z.string().min(1),
  args: z.record(z.string(), z.unknown()).default({}),
});

async function dispatch(userId: string, tool: string, args: Record<string, unknown>) {
  
  const calendar = await getCalendarServiceForUser(userId);
  const tools: ToolSet = getTools({ calendar });
  
  const matchedTool = tools[tool];
  
  if (!matchedTool?.execute) {
    throw new Error(`Unknown tool: ${tool}`);
  }

  return matchedTool.execute(args, {
    toolCallId: crypto.randomUUID(),
    messages: [],
    context: undefined,
  } as Parameters<typeof matchedTool.execute>[1]);
}

export async function POST(req: Request) {

  const body = bodySchema.safeParse(await req.json());

  if (!body.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const data = body.data;

  const payload = verifyToken<CallTokenPayload>(data.token);

  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  try {
    const result = await dispatch(payload.user_id, data.tool, data.args);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Tool failed" }, { status: 500 });
  }
}
