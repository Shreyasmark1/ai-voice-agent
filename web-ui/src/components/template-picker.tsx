"use client";

import { useMemo, useState } from "react";
import { cloneWorkflowFromTemplateAction } from "@/lib/actions/workflow";
import type { WorkflowTemplate } from "@/lib/templates";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function TemplatePicker({
  templates,
  businessOptions,
}: {
  templates: WorkflowTemplate[];
  businessOptions: { id: string; name: string; industry: string }[];
}) {
  const [businessId, setBusinessId] = useState(
    businessOptions[0]?.id ?? ""
  );
  const [pendingId, setPendingId] = useState<string | null>(null);

  const selectedIndustry =
    businessOptions.find((b) => b.id === businessId)?.industry ?? "";

  const filteredTemplates = useMemo(() => {
    if (!selectedIndustry) return templates;
    return templates.filter((t) => t.industry === selectedIndustry);
  }, [templates, selectedIndustry]);

  async function handleClone(templateId: string) {
    if (!businessId || pendingId) return;
    setPendingId(templateId);
    const formData = new FormData();
    formData.append("templateId", templateId);
    formData.append("businessId", businessId);
    await cloneWorkflowFromTemplateAction(formData);
  }

  return (
    <div className="space-y-4">
      <div className="max-w-sm space-y-2">
        <Label htmlFor="template-business">Create workflow into business</Label>
        <select
          id="template-business"
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
          className="h-10 w-full rounded-xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {businessOptions.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filteredTemplates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No templates for this industry yet. Build one from scratch above.
          </p>
        ) : (
          filteredTemplates.map((t) => (
            <Card key={t.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{t.name}</CardTitle>
                <CardDescription>{t.industry}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                <p className="flex-1 text-sm text-muted-foreground">
                  {t.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t.fields.length} questions
                  {t.conditions.length > 0 &&
                    ` · ${t.conditions.length} condition${
                      t.conditions.length > 1 ? "s" : ""
                    } (urgent flagging)`}
                </p>
                <Button
                  size="sm"
                  disabled={!businessId || pendingId === t.id}
                  onClick={() => handleClone(t.id)}
                  className="w-full"
                >
                  {pendingId === t.id ? "Creating..." : "Create from template"}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}