import { redirect } from "next/navigation";

import { getBusinesses } from "@/lib/actions/business";
import { WORKFLOW_TEMPLATES } from "@/lib/templates";
import { WorkflowBuilder } from "@/components/workflow-builder";
import { TemplatePicker } from "@/components/template-picker";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { Building03Icon } from "@hugeicons/core-free-icons";

export default async function NewWorkflowPage() {
  const businesses = await getBusinesses();

  if (businesses.length === 0) {
    redirect("/app/businesses/new");
  }

  const businessOptions = businesses.map((b) => ({
    id: b.id,
    name: b.name,
    industry: b.industry,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          New workflow
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Build your own workflow from scratch, or start from a ready-made
          template below.
        </p>
      </div>

      {businesses.length === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <HugeiconsIcon
                icon={Building03Icon}
                className="size-4 text-primary"
              />
              Using business: {businesses[0].name}
            </CardTitle>
            <CardDescription>
              You can pick a different business inside the form below.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div>
        <div className="mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Build from scratch
          </h2>
        </div>
        <WorkflowBuilder businesses={businessOptions} />
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            or start from a template
          </span>
        </div>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Choose a template
          </h2>
        </div>
        <TemplatePicker
          templates={WORKFLOW_TEMPLATES}
          businessOptions={businessOptions}
        />
      </section>
    </div>
  );
}