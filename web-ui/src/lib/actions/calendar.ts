"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { googleCalendarAccounts } from "@/db/schema";
import { auth } from "@/auth";

export async function disconnectGoogleCalendarAction(): Promise<{
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  await db
    .delete(googleCalendarAccounts)
    .where(eq(googleCalendarAccounts.userId, session.user.id));

  revalidatePath("/app/calendar");
  return {};
}
