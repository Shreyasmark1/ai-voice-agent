"use server";

import type { UIMessage } from "ai";
import { and, desc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import {
  businesses,
  conversations,
  workflowFields,
  workflows,
} from "@/db/schema";
import { auth } from "@/auth";
import {
  extractConversationMeta,
  insertConversationRecord,
  toTranscript,
} from "@/lib/agent/persistence";

export async function updateConversationStatusAction(
  conversationId: string,
  followUpStatus: string
) {
  const ownerId = await requireOwner();

  const conv = await db
    .select({
      id: conversations.id,
      businessOwnerId: businesses.ownerId,
    })
    .from(conversations)
    .innerJoin(businesses, eq(businesses.id, conversations.businessId))
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conv[0] || conv[0].businessOwnerId !== ownerId) {
    throw new Error("Conversation not found");
  }

  const mappedStatus =
    followUpStatus === "completed" || followUpStatus === "contacted"
      ? "closed"
      : "completed";

  await db
    .update(conversations)
    .set({
      followUpStatus,
      status: mappedStatus,
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, conversationId));

  revalidatePath("/app/records");
  revalidatePath(`/app/records/${conversationId}`);
}

export async function getConversations() {
  const ownerId = await requireOwner();

  const userBusinesses = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(eq(businesses.ownerId, ownerId));

  if (userBusinesses.length === 0) return [];

  const ids = userBusinesses.map((b) => b.id);

  return db
    .select({
      conversation: conversations,
      businessName: businesses.name,
      workflowName: workflows.name,
    })
    .from(conversations)
    .innerJoin(businesses, eq(businesses.id, conversations.businessId))
    .innerJoin(workflows, eq(workflows.id, conversations.workflowId))
    .where(inArray(conversations.businessId, ids))
    .orderBy(desc(conversations.createdAt));
}

export async function getConversation(id: string) {
  const ownerId = await requireOwner();

  const rows = await db
    .select({
      conversation: conversations,
      businessName: businesses.name,
      workflowName: workflows.name,
    })
    .from(conversations)
    .innerJoin(businesses, eq(businesses.id, conversations.businessId))
    .innerJoin(workflows, eq(workflows.id, conversations.workflowId))
    .where(and(eq(conversations.id, id), eq(businesses.ownerId, ownerId)))
    .limit(1);

  return rows[0] ?? null;
}

type StartConversationInput = {
  workflowId: string;
  callerName?: string | null;
  callerPhone?: string | null;
};

export async function startConversationAction(input: StartConversationInput) {
  const ownerId = await requireOwner();

  const wf = await db
    .select({
      workflow: workflows,
      businessOwnerId: businesses.ownerId,
    })
    .from(workflows)
    .innerJoin(businesses, eq(businesses.id, workflows.businessId))
    .where(eq(workflows.id, input.workflowId))
    .limit(1);

  const found = wf[0];
  if (!found || found.businessOwnerId !== ownerId) {
    throw new Error("Workflow not found");
  }

  const conversationId = crypto.randomUUID();

  await db.insert(conversations).values({
    id: conversationId,
    businessId: found.workflow.businessId,
    workflowId: input.workflowId,
    callerName: input.callerName?.trim() || null,
    callerPhone: input.callerPhone?.trim() || null,
    status: "in_progress",
    transcript: [],
  });

  return { conversationId };
}

type FinalizeAgentInput = {
  workflowId: string;
  messages: UIMessage[];
  simulated?: boolean;
  callerName?: string | null;
  callerPhone?: string | null;
  conversationId?: string | null;
};

export async function finalizeAgentConversationAction(input: FinalizeAgentInput) {
  const ownerId = await requireOwner();

  const wf = await db
    .select({
      workflow: workflows,
      businessOwnerId: businesses.ownerId,
    })
    .from(workflows)
    .innerJoin(businesses, eq(businesses.id, workflows.businessId))
    .where(eq(workflows.id, input.workflowId))
    .limit(1);

  const found = wf[0];
  if (!found || found.businessOwnerId !== ownerId) {
    throw new Error("Workflow not found");
  }

  const fields = await db
    .select()
    .from(workflowFields)
    .where(eq(workflowFields.workflowId, input.workflowId))
    .orderBy(workflowFields.order);

  const transcript = toTranscript(input.messages);
  const meta = await extractConversationMeta(
    found.workflow,
    fields,
    transcript
  );

  await insertConversationRecord({
    workflow: found.workflow,
    transcript,
    meta,
    simulated: input.simulated ?? true,
    callerName: input.callerName,
    callerPhone: input.callerPhone,
    conversationId: input.conversationId,
  });

  revalidatePath("/app/records");
  revalidatePath("/app/dashboard");
}

async function requireOwner() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return session.user.id;
}