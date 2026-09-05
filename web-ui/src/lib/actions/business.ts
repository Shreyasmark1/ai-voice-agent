"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { businesses } from "@/db/schema";
import { auth } from "@/auth";
import { INDUSTRIES } from "@/lib/constants";

const businessSchema = z.object({
  name: z.string().min(1, "Business name is required").max(255),
  industry: z.string().min(1, "Industry is required"),
  description: z.string().max(2000).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  timezone: z.string().min(1, "Timezone is required").default("Asia/Kolkata"),
  languages: z
    .array(z.string())
    .min(1, "Select at least one language")
    .default(["english"]),
});

export type BusinessState = {
  error?: string;
  fieldErrors?: z.inferFlattenedErrors<typeof businessSchema>["fieldErrors"];
};

function getFieldMap(formData: FormData) {
  const languagesRaw = formData.getAll("languages");
  return {
    name: formData.get("name"),
    industry: formData.get("industry"),
    description: formData.get("description") || null,
    phone: formData.get("phone") || null,
    timezone: formData.get("timezone") || "Asia/Kolkata",
    languages:
      languagesRaw.length > 0 ? languagesRaw.map(String) : ["english"],
  };
}

async function requireOwner() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }
  return session.user.id;
}

export async function createBusinessAction(
  _prevState: BusinessState | null,
  formData: FormData
): Promise<BusinessState | null> {
  const ownerId = await requireOwner();

  const parsed = businessSchema.safeParse(getFieldMap(formData));

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const validIndustry =
    INDUSTRIES.includes(parsed.data.industry as (typeof INDUSTRIES)[number]) ||
    parsed.data.industry === "Other"
      ? parsed.data.industry
      : "Other";

  await db.insert(businesses).values({
    ownerId,
    name: parsed.data.name,
    industry: validIndustry,
    description: parsed.data.description ?? null,
    phone: parsed.data.phone ?? null,
    timezone: parsed.data.timezone,
    languages: parsed.data.languages,
  });

  revalidatePath("/app/businesses");
  redirect("/app/businesses");
}

export async function updateBusinessAction(
  _prevState: BusinessState | null,
  formData: FormData
): Promise<BusinessState | null> {
  const ownerId = await requireOwner();
  const businessId = formData.get("id");
  if (!businessId || typeof businessId !== "string") {
    return { error: "Missing business id" };
  }

  const parsed = businessSchema.safeParse(getFieldMap(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await db
    .select({ id: businesses.id, ownerId: businesses.ownerId })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);
  if (!existing[0] || existing[0].ownerId !== ownerId) {
    return { error: "Business not found" };
  }

  const validIndustry =
    INDUSTRIES.includes(parsed.data.industry as (typeof INDUSTRIES)[number]) ||
    parsed.data.industry === "Other"
      ? parsed.data.industry
      : "Other";

  await db
    .update(businesses)
    .set({
      name: parsed.data.name,
      industry: validIndustry,
      description: parsed.data.description ?? null,
      phone: parsed.data.phone ?? null,
      timezone: parsed.data.timezone,
      languages: parsed.data.languages,
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, businessId));

  revalidatePath("/app/businesses");
  revalidatePath(`/app/businesses/${businessId}`);
  redirect(`/app/businesses/${businessId}`);
}

export async function deleteBusinessAction(businessId: string) {
  const ownerId = await requireOwner();

  const existing = await db
    .select({ id: businesses.id, ownerId: businesses.ownerId })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);
  if (!existing[0] || existing[0].ownerId !== ownerId) {
    throw new Error("Business not found");
  }

  await db.delete(businesses).where(eq(businesses.id, businessId));

  revalidatePath("/app/businesses");
  redirect("/app/businesses");
}

export async function getBusinesses() {
  const ownerId = await requireOwner();
  return db
    .select()
    .from(businesses)
    .where(eq(businesses.ownerId, ownerId))
    .orderBy(businesses.createdAt);
}

export async function getBusiness(id: string) {
  const ownerId = await requireOwner();
  const rows = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, id))
    .limit(1);
  const business = rows[0];
  if (!business || business.ownerId !== ownerId) {
    return null;
  }
  return business;
}