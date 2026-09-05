import Link from "next/link";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { googleCalendarAccounts } from "@/db/schema";
import { auth } from "@/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DisconnectCalendarButton } from "@/components/disconnect-calendar-button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { connected?: string; error?: string };
}) {
  const session = await auth();
  const userId = session?.user?.id;

  const account = userId
    ? await db
        .select()
        .from(googleCalendarAccounts)
        .where(eq(googleCalendarAccounts.userId, userId))
        .limit(1)
        .then((rows) => rows[0] ?? null)
    : null;

  const oauthEnabled =
    Boolean(process.env.GOOGLE_CLIENT_ID) &&
    Boolean(process.env.GOOGLE_CLIENT_SECRET);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Google Calendar
        </h1>
        <p className="text-sm text-muted-foreground">
          Connect your Google Calendar so the AI assistant can book
          appointments on your behalf.
        </p>
      </div>

      {!oauthEnabled && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Google OAuth is not configured. Set <code>GOOGLE_CLIENT_ID</code> and{" "}
          <code>GOOGLE_CLIENT_SECRET</code> to enable calendar connections. See{" "}
          <code>GOOGLE_CALENDAR_SETUP.md</code>.
        </div>
      )}

      {searchParams.connected && (
        <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
          Google Calendar connected successfully.
        </div>
      )}

      {searchParams.error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          Could not connect Google Calendar. Please try again.
        </div>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-sm">
              <HugeiconsIcon icon={Calendar03Icon} className="size-4 text-primary" />
              Your Google Calendar
            </CardTitle>
            <CardDescription>
              {account
                ? "Connected. The AI assistant can manage this calendar."
                : "Not connected yet."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {account ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  className="size-5 text-green-600"
                />
                <span>
                  Calendar: <span className="font-medium">{account.calendarId}</span>
                </span>
              </div>
              {account.connectedAt && (
                <p className="text-xs text-muted-foreground">
                  Connected{" "}
                  {new Date(account.connectedAt).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              )}
              <DisconnectCalendarButton />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Once connected, calendar tools are available to the AI assistant
                during simulations. Without a connection, the assistant simply
                won&apos;t offer booking.
              </p>
              <Link
                href="/api/auth/google"
                className={cn(
                  buttonVariants({ variant: "default", size: "default" })
                )}
              >
                Connect Google Calendar
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
