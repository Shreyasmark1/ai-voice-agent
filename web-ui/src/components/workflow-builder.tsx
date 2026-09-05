"use client";

import { useActionState, useState } from "react";
import {
  createWorkflowAction,
  updateWorkflowAction,
  type WorkflowState,
} from "@/lib/actions/workflow";
import {
  CONDITION_OPERATORS,
  FIELD_TYPES,
  WORKFLOW_ACTIONS,
  WORKFLOW_LANGUAGES,
} from "@/lib/constants";
import type { WorkflowCondition, WorkflowFieldType } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type WorkflowFieldDraft = {
  id?: string;
  key: string;
  label: string;
  type: WorkflowFieldType;
  required: boolean;
  order: number;
  options: string[];
  placeholder: string;
};

type BuilderBusiness = { id: string; name: string };

type WorkflowData = {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  trigger?: string;
  language: string;
  greeting: string;
  closingMessage: string;
  actionAfterCollection: string;
  active: boolean;
  conditions: WorkflowCondition[];
  fields: {
    id: string;
    workflowId: string;
    key: string;
    label: string;
    type: string;
    required: boolean;
    order: number;
    options: string[];
    placeholder: string | null;
  }[];
};

function slugify(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 100);
}

function defaultField(order: number): WorkflowFieldDraft {
  return {
    key: "",
    label: "",
    type: "text",
    required: false,
    order,
    options: [],
    placeholder: "",
  };
}

function toDraftFields(wf?: WorkflowData): WorkflowFieldDraft[] {
  if (!wf || wf.fields.length === 0) {
    return [
      defaultField(0),
      {
        ...defaultField(1),
        label: "Your phone number",
        key: "phone",
        type: "phone",
        required: true,
      },
    ];
  }
  return wf.fields
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((f) => ({
      id: f.id,
      key: f.key,
      label: f.label,
      type: f.type as WorkflowFieldType,
      required: f.required,
      order: f.order,
      options: f.options,
      placeholder: f.placeholder ?? "",
    }));
}

export function WorkflowBuilder({
  businesses,
  workflow,
}: {
  businesses: BuilderBusiness[];
  workflow?: WorkflowData;
}) {
  const isEdit = Boolean(workflow);
  const [state, formAction, pending] = useActionState<
    WorkflowState | null,
    FormData
  >(isEdit ? updateWorkflowAction : createWorkflowAction, null);

  const [fields, setFields] = useState<WorkflowFieldDraft[]>(() =>
    toDraftFields(workflow)
  );
  const [conditions, setConditions] = useState<WorkflowCondition[]>(
    () => workflow?.conditions ?? []
  );

  function updateField(index: number, patch: Partial<WorkflowFieldDraft>) {
    setFields((prev) => {
      const next = prev.map((f, i) => (i === index ? { ...f, ...patch } : f));
      if ("label" in patch) {
        next[index] = {
          ...next[index],
          key: slugify(String(patch.label || "")),
        };
      }
      return next;
    });
  }

  function addField() {
    setFields((prev) => [...prev, defaultField(prev.length)]);
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index).map((f, i) => ({ ...f, order: i })));
  }

  function moveField(index: number, dir: -1 | 1) {
    setFields((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const copy = prev.slice();
      const tmp = copy[index];
      copy[index] = copy[target];
      copy[target] = tmp;
      return copy.map((f, i) => ({ ...f, order: i }));
    });
  }

  function onChangeCondition(index: number, patch: Partial<WorkflowCondition>) {
    setConditions((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...patch } : c))
    );
  }

  function addCondition() {
    setConditions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        fieldKey: fields[0]?.key ?? "",
        operator: "eq",
        value: "",
        outcome: "mark_urgent",
      },
    ]);
  }

  function removeCondition(index: number) {
    setConditions((prev) => prev.filter((_, i) => i !== index));
  }

  const fieldOptions = fields.filter((f) => f.key).map((f) => ({ key: f.key, label: f.label }));

  return (
    <form action={formAction} className="space-y-8">
      {workflow && <input type="hidden" name="id" value={workflow.id} />}
      <input type="hidden" name="fields_json" value={JSON.stringify(fields)} />
      <input type="hidden" name="conditions_json" value={JSON.stringify(conditions)} />

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            1. Basics
          </h2>
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessId">Business</Label>
          <select
            id="businessId"
            name="businessId"
            defaultValue={workflow?.businessId ?? ""}
            required
            className="h-10 w-full rounded-xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <option value="" disabled>
              Select business
            </option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          {state?.fieldErrors?.businessId && (
            <p className="text-sm text-destructive">
              {state.fieldErrors.businessId[0]}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Workflow name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Missed call - Cake order"
              defaultValue={workflow?.name}
              required
            />
            {state?.fieldErrors?.name && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.name[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="language">Conversation language</Label>
            <select
              id="language"
              name="language"
              defaultValue={workflow?.language ?? "english"}
              className="h-10 w-full rounded-xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {WORKFLOW_LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="What should this workflow handle?"
            defaultValue={workflow?.description ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="trigger">Trigger</Label>
          <select
            id="trigger"
            name="trigger"
            defaultValue={workflow?.trigger ?? "missed_call"}
            className="h-10 w-full rounded-xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <option value="missed_call">Missed call</option>
          </select>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            2. Conversation script
          </h2>
        </div>

        <div className="space-y-2">
          <Label htmlFor="greeting">Greeting (opening message)</Label>
          <Textarea
            id="greeting"
            name="greeting"
            placeholder="Hi! You called Sweet Bloom Cakes. Are you looking to order a cake, or is it a general enquiry?"
            defaultValue={workflow?.greeting}
            required
          />
          {state?.fieldErrors?.greeting && (
            <p className="text-sm text-destructive">
              {state.fieldErrors.greeting[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="closingMessage">Closing message</Label>
          <Textarea
            id="closingMessage"
            name="closingMessage"
            placeholder="Thanks! We have your details saved. We'll reach out to confirm shortly."
            defaultValue={workflow?.closingMessage}
            required
          />
          {state?.fieldErrors?.closingMessage && (
            <p className="text-sm text-destructive">
              {state.fieldErrors.closingMessage[0]}
            </p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            3. Questions / data to collect
          </h2>
          <Button type="button" variant="outline" size="sm" onClick={addField}>
            + Add question
          </Button>
        </div>

        {state?.fieldErrors?.fields && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.fields[0]}
          </p>
        )}

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div
              key={index}
              className="rounded-2xl border border-border bg-muted/30 p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  Question {index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={index === 0}
                    onClick={() => moveField(index, -1)}
                    aria-label="Move up"
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={index === fields.length - 1}
                    onClick={() => moveField(index, 1)}
                    aria-label="Move down"
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeField(index)}
                    aria-label="Remove question"
                  >
                    ×
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Question text</Label>
                  <Input
                    value={field.label}
                    placeholder="e.g. What type of cake do you need?"
                    onChange={(e) => updateField(index, { label: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Field type</Label>
                  <select
                    value={field.type}
                    onChange={(e) =>
                      updateField(index, {
                        type: e.target.value as WorkflowFieldType,
                      })
                    }
                    className="h-10 w-full rounded-xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Field key</Label>
                  <Input value={field.key} disabled placeholder="auto-generated" />
                </div>

                {field.type === "choice" && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Options (comma separated)</Label>
                    <Input
                      value={field.options.join(", ")}
                      placeholder="chocolate, vanilla, red velvet"
                      onChange={(e) =>
                        updateField(index, {
                          options: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </div>
                )}

                {(field.type === "text" ||
                  field.type === "textarea" ||
                  field.type === "phone") && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Placeholder / hint</Label>
                    <Input
                      value={field.placeholder}
                      placeholder="e.g. Your best contact number"
                      onChange={(e) =>
                        updateField(index, { placeholder: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>

              <label className="mt-3 flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) =>
                    updateField(index, { required: e.target.checked })
                  }
                  className="size-4 rounded"
                />
                Required field
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            4. Action after collection
          </h2>
        </div>

        <div className="space-y-2">
          <Label htmlFor="actionAfterCollection">What happens after data is collected?</Label>
          <select
            id="actionAfterCollection"
            name="actionAfterCollection"
            defaultValue={workflow?.actionAfterCollection ?? "freeform"}
            className="h-10 w-full rounded-xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {WORKFLOW_ACTIONS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
          {state?.fieldErrors?.actionAfterCollection && (
            <p className="text-sm text-destructive">
              {state.fieldErrors.actionAfterCollection[0]}
            </p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            5. Conditional branches
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCondition}
            disabled={fieldOptions.length === 0}
          >
            + Add condition
          </Button>
        </div>

        <div className="space-y-3">
          {conditions.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No conditions. Conversations will be marked normal priority. Add a
              condition to flag urgent conversations.
            </p>
          )}
          {conditions.map((condition, index) => (
            <div
              key={condition.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  If…
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeCondition(index)}
                  aria-label="Remove condition"
                >
                  ×
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Field</Label>
                  <select
                    value={condition.fieldKey}
                    onChange={(e) =>
                      onChangeCondition(index, { fieldKey: e.target.value })
                    }
                    className="h-10 w-full rounded-xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <option value="" disabled>
                      Select field
                    </option>
                    {fieldOptions.map((o) => (
                      <option key={o.key} value={o.key}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Operator</Label>
                  <select
                    value={condition.operator}
                    onChange={(e) =>
                      onChangeCondition(index, {
                        operator: e.target.value as WorkflowCondition["operator"],
                      })
                    }
                    className="h-10 w-full rounded-xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    {CONDITION_OPERATORS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Value</Label>
                  <Input
                    value={condition.value}
                    placeholder={
                      condition.operator === "within_days"
                        ? "e.g. 1 (days)"
                        : "e.g. chocolate"
                    }
                    onChange={(e) =>
                      onChangeCondition(index, { value: e.target.value })
                    }
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                → Mark conversation as{" "}
                <span className="font-medium text-destructive">urgent</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            6. Status
          </h2>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="active"
            defaultChecked={workflow?.active ?? true}
            className="size-4 rounded"
          />
          Workflow is active
        </label>
      </section>

      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : isEdit ? "Save changes" : "Create workflow"}
      </Button>
    </form>
  );
}