"use server";

import { and, asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { businesses, workflowFields, workflows } from "@/db/schema";
import type { WorkflowCondition } from "@/db/schema";
import { auth } from "@/auth";
import {
  CONDITION_OPERATORS,
  FIELD_TYPES,
  URGENCY_VALUES,
  WORKFLOW_LANGUAGES,
} from "@/lib/constants";
import { getTemplate } from "@/lib/templates";

const workflowConditionSchema = z.object({
  id: z.string(),
  fieldKey: z.string().min(1, "Field is required"),
  operator: z.enum(CONDITION_OPERATORS.map((o) => o.value) as [string, ...string[]]),
  value: z.string().min(1, "Value is required"),
  urgency: z.enum(URGENCY_VALUES),
});

const workflowFieldSchema = z.object({
  id: z.string().optional(),
  key: z.string().min(1, "Field key is required").max(100),
  label: z.string().min(1, "Question text is required"),
  type: z.enum(FIELD_TYPES.map((t) => t.value) as [string, ...string[]]),
  required: z.boolean().default(false),
  order: z.number(),
  options: z.array(z.string()).default([]),
  placeholder: z.string().optional(),
});

const workflowSchema = z.object({
  businessId: z.string().min(1, "Select a business"),
  name: z.string().min(1, "Workflow name is required").max(255),
  description: z.string().max(2000).nullable().optional(),
  language: z.enum(
    WORKFLOW_LANGUAGES.map((l) => l.value) as [string, ...string[]]
  ),
  greeting: z.string().min(1, "Greeting is required"),
  closingMessage: z.string().min(1, "Closing message is required"),
  active: z.boolean().default(true),
  fields: z.array(workflowFieldSchema).min(1, "Add at least one question"),
  conditions: z.array(workflowConditionSchema).default([]),
});

export type WorkflowState = {
  error?: string;
  fieldErrors?: z.inferFlattenedErrors<typeof workflowSchema>["fieldErrors"];
};

function parseJsonList(raw: FormDataEntryValue | null): unknown[] {
  if (!raw || typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getFormMap(formData: FormData) {
  const fields = parseJsonList(formData.get("fields_json"));
  const conditions = parseJsonList(formData.get("conditions_json"));
  return {
    businessId: formData.get("businessId"),
    name: formData.get("name"),
    description: formData.get("description") || null,
    language: formData.get("language") || "english",
    greeting: formData.get("greeting"),
    closingMessage: formData.get("closingMessage"),
    active: formData.get("active") === "on",
    fields,
    conditions,
  };
}

async function requireOwner() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return session.user.id;
}

async function assertBusinessOwned(ownerId: string, businessId: string) {
  const rows = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(and(eq(businesses.id, businessId), eq(businesses.ownerId, ownerId)))
    .limit(1);
  if (!rows[0]) {
    throw new Error("Business not found");
  }
}

export async function createWorkflowAction(
  _prevState: WorkflowState | null,
  formData: FormData
): Promise<WorkflowState | null> {
  const ownerId = await requireOwner();
  const map = getFormMap(formData);
  const parsed = workflowSchema.safeParse(map as z.input<typeof workflowSchema>);

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { businessId, fields, conditions, ...data } = parsed.data;
  await assertBusinessOwned(ownerId, businessId);

  const inserted = await db
    .insert(workflows)
    .values({
      ...data,
      businessId,
      conditions: conditions as WorkflowCondition[],
    })
    .returning({ id: workflows.id });

  const workflowId = inserted[0].id;

  if (fields.length > 0) {
    await db.insert(workflowFields).values(
      fields.map((f, i) => ({
        workflowId,
        key: f.key,
        label: f.label,
        type: f.type,
        required: f.required,
        order: f.order >= 0 ? f.order : i,
        options: f.options,
        placeholder: f.placeholder ?? null,
      }))
    );
  }

  revalidatePath("/app/workflows");
  redirect(`/app/workflows/${workflowId}`);
}

export async function updateWorkflowAction(
  _prevState: WorkflowState | null,
  formData: FormData
): Promise<WorkflowState | null> {
  const ownerId = await requireOwner();
  const workflowId = formData.get("id");
  if (!workflowId || typeof workflowId !== "string") {
    return { error: "Missing workflow id" };
  }

  const existing = await db
    .select({
      id: workflows.id,
      businessId: workflows.businessId,
    })
    .from(workflows)
    .where(eq(workflows.id, workflowId))
    .limit(1);
  if (!existing[0]) {
    return { error: "Workflow not found" };
  }

  const map = getFormMap(formData);
  const parsed = workflowSchema.safeParse(map as z.input<typeof workflowSchema>);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { businessId, fields, conditions, ...data } = parsed.data;
  await assertBusinessOwned(ownerId, businessId);

  await db
    .update(workflows)
    .set({
      ...data,
      businessId,
      conditions: conditions as WorkflowCondition[],
      updatedAt: new Date(),
    })
    .where(eq(workflows.id, workflowId));

  await db.delete(workflowFields).where(eq(workflowFields.workflowId, workflowId));
  if (fields.length > 0) {
    await db.insert(workflowFields).values(
      fields.map((f, i) => ({
        workflowId,
        key: f.key,
        label: f.label,
        type: f.type,
        required: f.required,
        order: f.order >= 0 ? f.order : i,
        options: f.options,
        placeholder: f.placeholder ?? null,
      }))
    );
  }

  revalidatePath("/app/workflows");
  revalidatePath(`/app/workflows/${workflowId}`);
  redirect(`/app/workflows/${workflowId}`);
}

export async function deleteWorkflowAction(workflowId: string) {
  const ownerId = await requireOwner();

  const existing = await db
    .select({ id: workflows.id, businessId: workflows.businessId })
    .from(workflows)
    .where(eq(workflows.id, workflowId))
    .limit(1);
  if (!existing[0]) {
    throw new Error("Workflow not found");
  }
  await assertBusinessOwned(ownerId, existing[0].businessId);

  await db.delete(workflows).where(eq(workflows.id, workflowId));

  revalidatePath("/app/workflows");
  redirect("/app/workflows");
}

export async function cloneWorkflowFromTemplateAction(formData: FormData) {
  const ownerId = await requireOwner();

  const templateId = formData.get("templateId");
  const businessId = formData.get("businessId");

  if (!templateId || typeof templateId !== "string") {
    throw new Error("Missing template");
  }
  if (!businessId || typeof businessId !== "string") {
    throw new Error("Select a business");
  }

  const template = getTemplate(templateId);
  if (!template) {
    throw new Error("Template not found");
  }

  await assertBusinessOwned(ownerId, businessId);

  const inserted = await db
    .insert(workflows)
    .values({
      businessId,
      name: template.name,
      description: template.description,
      trigger: "missed_call",
      language: template.language,
      greeting: template.greeting,
      closingMessage: template.closingMessage,
      conditions: template.conditions,
      active: true,
    })
    .returning({ id: workflows.id });

  const workflowId = inserted[0].id;

  await db.insert(workflowFields).values(
    template.fields.map((f, i) => ({
      workflowId,
      key: f.key,
      label: f.label,
      type: f.type,
      required: f.required,
      order: i,
      options: f.options ?? [],
      placeholder: f.placeholder ?? null,
    }))
  );

  revalidatePath("/app/workflows");
  redirect(`/app/workflows/${workflowId}`);
}

export async function getWorkflows() {
  const ownerId = await requireOwner();

  const userBusinesses = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(eq(businesses.ownerId, ownerId));

  if (userBusinesses.length === 0) return [];

  const ids = userBusinesses.map((b) => b.id);

  return db
    .select()
    .from(workflows)
    .where(inArray(workflows.businessId, ids))
    .orderBy(asc(workflows.createdAt));
}

export async function getWorkflow(id: string) {
  const ownerId = await requireOwner();

  const row = await db
    .select({
      workflow: workflows,
      business: businesses,
    })
    .from(workflows)
    .innerJoin(businesses, eq(businesses.id, workflows.businessId))
    .where(eq(workflows.id, id))
    .limit(1);

  const found = row[0];
  if (!found || found.business.ownerId !== ownerId) {
    return null;
  }

  const fields = await db
    .select()
    .from(workflowFields)
    .where(eq(workflowFields.workflowId, id))
    .orderBy(asc(workflowFields.order));

  return { ...found.workflow, business: found.business, fields };
}