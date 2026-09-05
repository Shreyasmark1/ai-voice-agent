"use client";

import { useActionState } from "react";
import {
  createBusinessAction,
  updateBusinessAction,
  type BusinessState,
} from "@/lib/actions/business";
import { INDUSTRIES, BUSINESS_LANGUAGES, TIMEZONES } from "@/lib/constants";
import type { Business } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function BusinessForm({ business }: { business?: Business }) {
  const isEdit = Boolean(business);
  const [state, formAction, pending] = useActionState<
    BusinessState | null,
    FormData
  >(isEdit ? updateBusinessAction : createBusinessAction, null);

  return (
    <form action={formAction} className="space-y-5">
      {business && <input type="hidden" name="id" value={business.id} />}

      <div className="space-y-2">
        <Label htmlFor="name">Business name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Sweet Bloom Cakes"
          defaultValue={business?.name}
          required
        />
        {state?.fieldErrors?.name && (
          <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="industry">Industry</Label>
        <select
          id="industry"
          name="industry"
          defaultValue={business?.industry ?? ""}
          required
          className="h-10 w-full rounded-xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <option value="" disabled>
            Select industry
          </option>
          {INDUSTRIES.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
        {state?.fieldErrors?.industry && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.industry[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="What does this business do?"
          defaultValue={business?.description ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="+1 555 000 0000"
          defaultValue={business?.phone ?? ""}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <select
          id="timezone"
          name="timezone"
          defaultValue={business?.timezone ?? "Asia/Kolkata"}
          className="h-10 w-full rounded-xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {TIMEZONES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="space-y-2">
        <Label>Languages</Label>
        <div className="flex flex-wrap gap-3">
          {BUSINESS_LANGUAGES.map((l) => (
            <label
              key={l}
              className="flex items-center gap-2 text-sm font-medium capitalize"
            >
              <input
                type="checkbox"
                name="languages"
                value={l}
                defaultChecked={
                  business
                    ? business.languages.includes(l)
                    : l === "english"
                }
                className="size-4 rounded"
              />
              {l}
            </label>
          ))}
        </div>
        {state?.fieldErrors?.languages && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.languages[0]}
          </p>
        )}
      </fieldset>

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : isEdit ? "Save changes" : "Create business"}
        </Button>
      </div>
    </form>
  );
}