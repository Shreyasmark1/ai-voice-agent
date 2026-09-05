"use client";

import { disconnectGoogleCalendarAction } from "@/lib/actions/calendar";
import { Button } from "@/components/ui/button";

export function DisconnectCalendarButton() {
  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={async () => {
        if (confirm("Disconnect your Google Calendar from this app?")) {
          await disconnectGoogleCalendarAction();
        }
      }}
    >
      Disconnect
    </Button>
  );
}
