"use client";

import { useActionState } from "react";
import { registerAction, type RegisterState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<
    RegisterState | null,
    FormData
  >(registerAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className="h-10 w-full rounded-xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />
        {state?.fieldErrors?.name && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.name[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-10 w-full rounded-xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />
        {state?.fieldErrors?.email && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.email[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="h-10 w-full rounded-xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        />
        {state?.fieldErrors?.password && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.password[0]}
          </p>
        )}
      </div>

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
