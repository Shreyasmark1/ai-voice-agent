import Link from "next/link";

import { getWorkflows } from "@/lib/actions/workflow";
import { getBusinesses } from "@/lib/actions/business";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusIcon,
  WorkflowSquare01Icon,
  Building03Icon,
} from "@hugeicons/core-free-icons";

export default async function WorkflowsPage() {
  const [workflows, businesses] = await Promise.all([
    getWorkflows(),
    getBusinesses(),
  ]);

  const businessNames = new Map(businesses.map((b) => [b.id, b.name]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workflows</h1>
          <p className="text-sm text-muted-foreground">
            Missed-call automation workflows.
          </p>
        </div>
        <Link
          href="/app/workflows/new"
          className={cn(buttonVariants({ variant: "default", size: "default" }))}
        >
          <HugeiconsIcon icon={PlusIcon} className="size-4" />
          New workflow
        </Link>
      </div>

      {businesses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-muted">
              <HugeiconsIcon
                icon={Building03Icon}
                className="size-6 text-muted-foreground"
              />
            </span>
            <div className="space-y-1">
              <CardTitle>Create a business first</CardTitle>
              <CardDescription>
                Workflows belong to a business. Create a business profile to get
                started.
              </CardDescription>
            </div>
            <Link
              href="/app/businesses/new"
              className={cn(
                buttonVariants({ variant: "default", size: "default" }),
                "mt-2"
              )}
            >
              Create business
            </Link>
          </CardContent>
        </Card>
      ) : workflows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-muted">
              <HugeiconsIcon
                icon={WorkflowSquare01Icon}
                className="size-6 text-muted-foreground"
              />
            </span>
            <div className="space-y-1">
              <CardTitle>No workflows yet</CardTitle>
              <CardDescription>
                Build your first missed-call workflow for{" "}
                {businesses[0]?.name ?? "your business"} or another one.
              </CardDescription>
            </div>
            <Link
              href="/app/workflows/new"
              className={cn(
                buttonVariants({ variant: "default", size: "default" }),
                "mt-2"
              )}
            >
              <HugeiconsIcon icon={PlusIcon} className="size-4" />
              Create workflow
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workflows.map((w) => (
            <Link key={w.id} href={`/app/workflows/${w.id}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="truncate">{w.name}</CardTitle>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-xs",
                        w.active
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {w.active ? "Active" : "Paused"}
                    </span>
                  </div>
                  <CardDescription className="truncate">
                    {businessNames.get(w.businessId) ?? "Unknown business"} ·{" "}
                    {w.language}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {w.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {w.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}