"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateConversationStatusAction } from "@/lib/actions/conversation";
import { Button } from "@/components/ui/button";

export function FollowUpStatusButton({
  conversationId,
  current,
}: {
  conversationId: string;
  current: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function setStatus(status: string) {
    if (pending) return;
    setPending(true);
    try {
      await updateConversationStatusAction(conversationId, status);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const options = ["pending", "contacted", "completed", "closed"];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <Button
          key={opt}
          size="sm"
          variant={current === opt ? "default" : "outline"}
          disabled={pending}
          onClick={() => setStatus(opt)}
        >
          {opt}
        </Button>
      ))}
    </div>
  );
}