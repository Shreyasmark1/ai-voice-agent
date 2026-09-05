"use server";

import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { redirect } from "next/navigation";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type RegisterState = {
  error?: string;
  fieldErrors?: {
    name?: string[];
    email?: string[];
    password?: string[];
  };
};

export async function registerAction(
  _prevState: RegisterState | null,
  formData: FormData
): Promise<RegisterState | null> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = parsed.data;

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (existing[0]) {
    return {
      error: "An account with this email already exists.",
    };
  }

  const passwordHash = await hash(password, 12);

  await db.insert(users).values({
    name,
    email: email.toLowerCase(),
    passwordHash,
  });

  redirect("/login");
}
