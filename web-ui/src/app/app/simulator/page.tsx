import { redirect } from "next/navigation";
import Link from "next/link";

import { getWorkflows } from "@/lib/actions/workflow";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { WorkflowSquare01Icon } from "@hugeicons/core-free-icons";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

export default async function SimulatorPage() {
  const workflows = await getWorkflows();

  if (workflows.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Simulator</h1>
          <p className="text-sm text-muted-foreground">
            Test a missed call against a workflow.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-muted">
              <HugeiconsIcon
                icon={WorkflowSquare01Icon}
                className="size-6 text-muted-foreground"
              />
            </span>
            <div className="space-y-1">
              <CardTitle>No workflows to simulate</CardTitle>
              <CardDescription>
                Create a workflow first, then run it through the simulator.
              </CardDescription>
            </div>
            <Link
              href="/app/workflows/new"
              className={cn(
                buttonVariants({ variant: "default", size: "default" }),
                "mt-2"
              )}
            >
              Create workflow
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const firstWorkflow = workflows[0];

  redirect(`/app/simulator/${firstWorkflow.id}`);
}