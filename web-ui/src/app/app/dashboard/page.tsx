import Link from "next/link";

import { getBusinesses } from "@/lib/actions/business";
import { getWorkflows } from "@/lib/actions/workflow";
import { getConversations } from "@/lib/actions/conversation";
import { urgencyBadge } from "@/lib/urgency";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlusIcon,
  Building03Icon,
  WorkflowSquare01Icon,
  PhoneCallIcon,
} from "@hugeicons/core-free-icons";

export default async function DashboardPage() {
  const [businesses, workflows, records] = await Promise.all([
    getBusinesses(),
    getWorkflows(),
    getConversations(),
  ]);

  const urgentCount = records.filter(
    (r) => r.conversation.urgency === "urgent"
  ).length;
  const recent = records.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of your missed-call automation setup.
          </p>
        </div>
        <Link
          href="/app/businesses/new"
          className={cn(buttonVariants({ variant: "default", size: "default" }))}
        >
          <HugeiconsIcon icon={PlusIcon} className="size-4" />
          New business
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/app/businesses">
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <HugeiconsIcon icon={Building03Icon} className="size-4 text-primary" />
                Businesses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{businesses.length}</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/app/workflows">
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <HugeiconsIcon icon={WorkflowSquare01Icon} className="size-4 text-primary" />
                Workflows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{workflows.length}</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/app/records">
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <HugeiconsIcon icon={PhoneCallIcon} className="size-4 text-primary" />
                Call records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{records.length}</p>
              {urgentCount > 0 && (
                <p className="mt-1 text-xs font-medium text-red-600">
                  {urgentCount} urgent
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm">Recent calls</CardTitle>
            <CardDescription>
              Latest missed-call conversations
            </CardDescription>
          </div>
          <Link
            href="/app/records"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No calls yet.{" "}
              <Link href="/app/simulator" className="text-primary hover:underline">
                Run the simulator
              </Link>{" "}
              to generate one.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((r) => (
                <li key={r.conversation.id}>
                  <Link
                    href={`/app/records/${r.conversation.id}`}
                    className="flex items-center justify-between gap-3 py-3 hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {r.conversation.callerName ?? "Unknown caller"}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {r.conversation.intent}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {(r.conversation.urgency === "urgent" ||
                        r.conversation.urgency === "moderate") && (
                        <span
                          className={
                            urgencyBadge(r.conversation.urgency).className
                          }
                        >
                          {urgencyBadge(r.conversation.urgency).label}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.conversation.createdAt).toLocaleDateString(
                          undefined,
                          { day: "numeric", month: "short" }
                        )}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}