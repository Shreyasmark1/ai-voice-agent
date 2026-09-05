import Link from "next/link";
import { notFound } from "next/navigation";

import { getWorkflow, getWorkflows } from "@/lib/actions/workflow";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SimulatorModeToggle } from "@/components/simulator-mode-toggle";

export default async function SimulatorRunPage({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) {
  const { workflowId } = await params;
  const [workflow, allWorkflows] = await Promise.all([
    getWorkflow(workflowId),
    getWorkflows(),
  ]);

  if (!workflow) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Simulator
        </h1>
        <p className="text-sm text-muted-foreground">
          Simulate a missed call against a workflow. Answers are stored as a
          record for the dashboard.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {allWorkflows.map((w) => (
          <Link
            key={w.id}
            href={`/app/simulator/${w.id}`}
            className={cn(
              buttonVariants({
                variant: w.id === workflowId ? "default" : "secondary",
                size: "sm",
              })
            )}
          >
            {w.name}
          </Link>
        ))}
      </div>

      <SimulatorModeToggle
        mode="chat"
        workflow={{
          id: workflow.id,
          businessId: workflow.businessId,
          greeting: workflow.greeting,
          closingMessage: workflow.closingMessage,
          language: workflow.language,
        }}
      />
    </div>
  );
}