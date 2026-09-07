import { notFound } from "next/navigation";
import Link from "next/link";

import { getConversation } from "@/lib/actions/conversation";
import { FollowUpStatusButton } from "@/components/follow-up-status-button";
import { urgencyTextClass } from "@/lib/urgency";
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
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await getConversation(id);

  if (!record) {
    notFound();
  }

  const conv = record.conversation;
  const collected = Object.entries(conv.collectedData).filter(
    ([key, value]) =>
      !["caller_name", "phone"].includes(key) &&
      value !== "" &&
      value !== null &&
      value !== undefined
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href="/app/records"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "mb-1 -ml-2"
            )}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
            Back to records
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {conv.callerName ?? "Unknown caller"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {conv.callerPhone ?? "No phone"} ·{" "}
            {new Date(conv.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Details</CardTitle>
            <CardDescription>Business, workflow and context</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Business:</span> {record.businessName}</div>
            <div><span className="text-muted-foreground">Workflow:</span> {record.workflowName}</div>
            <div><span className="text-muted-foreground">Intent:</span> {conv.intent}</div>
            <div>
              <span className="text-muted-foreground">Urgency:</span>{" "}
              <span className={urgencyTextClass(conv.urgency)}>
                {conv.urgency}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Action:</span>{" "}
              {conv.actionAfterCollection}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Follow-up</CardTitle>
            <CardDescription>Mark this record as handled</CardDescription>
          </CardHeader>
          <CardContent>
            <FollowUpStatusButton
              conversationId={conv.id}
              current={conv.followUpStatus}
            />
          </CardContent>
        </Card>
      </div>

      {conv.summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{conv.summary}</p>
          </CardContent>
        </Card>
      )}

      {collected.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Information collected</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-2 sm:grid-cols-2">
              {collected.map(([key, value]) => (
                <div key={key} className="text-sm">
                  <dt className="text-muted-foreground">{key.replace(/_/g, " ")}</dt>
                  <dd className="font-medium">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Transcript</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {conv.transcript.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transcript.</p>
          ) : (
            conv.transcript.map((entry, i) => (
              <div
                key={i}
                className={`flex ${entry.role === "assistant" ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    entry.role === "assistant"
                      ? "bg-muted text-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {entry.content}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}