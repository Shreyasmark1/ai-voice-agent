import { notFound } from "next/navigation";
import Link from "next/link";

import { getWorkflow } from "@/lib/actions/workflow";
import { getBusinesses } from "@/lib/actions/business";
import { WorkflowBuilder } from "@/components/workflow-builder";
import { DeleteWorkflowButton } from "@/components/delete-workflow-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

export default async function WorkflowEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [workflow, businesses] = await Promise.all([
    getWorkflow(id),
    getBusinesses(),
  ]);

  if (!workflow) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/app/workflows"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "mb-1 -ml-2"
            )}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
            Back
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            Edit workflow
          </h1>
        </div>

        <DeleteWorkflowButton workflowId={workflow.id} />
      </div>

      <WorkflowBuilder
        businesses={businesses.map((b) => ({ id: b.id, name: b.name }))}
        workflow={{
          id: workflow.id,
          businessId: workflow.businessId,
          name: workflow.name,
          description: workflow.description,
          language: workflow.language,
          greeting: workflow.greeting,
          closingMessage: workflow.closingMessage,
          active: workflow.active,
          conditions: workflow.conditions,
          fields: workflow.fields.map((f) => ({
            id: f.id,
            workflowId: f.workflowId,
            key: f.key,
            label: f.label,
            type: f.type,
            required: f.required,
            order: f.order,
            options: f.options,
            placeholder: f.placeholder,
          })),
        }}
      />
    </div>
  );
}