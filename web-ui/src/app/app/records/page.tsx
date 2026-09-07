import Link from "next/link";

import { getConversations } from "@/lib/actions/conversation";
import { urgencyBadge } from "@/lib/urgency";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { FileAudioIcon } from "@hugeicons/core-free-icons";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600",
  contacted: "bg-blue-500/10 text-blue-600",
  completed: "bg-emerald-500/10 text-emerald-600",
  closed: "bg-zinc-500/10 text-zinc-600",
};

export default async function RecordsPage() {
  const records = await getConversations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Records</h1>
        <p className="text-sm text-muted-foreground">
          Customer conversations, captured details, and follow-up status.
        </p>
      </div>

      {records.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-muted">
              <HugeiconsIcon
                icon={FileAudioIcon}
                className="size-6 text-muted-foreground"
              />
            </span>
            <div className="space-y-1">
              <CardTitle>No records yet</CardTitle>
              <CardDescription>
                Run a workflow through the simulator to generate the first
                record.
              </CardDescription>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Caller</th>
                <th className="px-4 py-3 font-medium">Business / Workflow</th>
                <th className="px-4 py-3 font-medium">Intent</th>
                <th className="px-4 py-3 font-medium">Urgency</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.map((r) => {
                const badge = urgencyBadge(r.conversation.urgency);
                return (
                <tr
                  key={r.conversation.id}
                  className="hover:bg-muted/40"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/records/${r.conversation.id}`}
                      className="font-medium hover:underline"
                    >
                      {r.conversation.callerName ?? "Unknown caller"}
                    </Link>
                    {r.conversation.callerPhone && (
                      <div className="text-xs text-muted-foreground">
                        {r.conversation.callerPhone}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div>{r.businessName}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.workflowName}
                    </div>
                  </td>
                  <td className="px-4 py-3">{r.conversation.intent}</td>
                  <td className="px-4 py-3">
                    <span className={badge.className}>{badge.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[r.conversation.followUpStatus] ??
                        "bg-muted text-muted-foreground"
                      }`}
                    >
                      {r.conversation.followUpStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(r.conversation.createdAt).toLocaleDateString(
                      undefined,
                      { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }
                    )}
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}