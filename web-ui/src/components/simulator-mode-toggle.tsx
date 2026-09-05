"use client";

import { useState } from "react";

import type { Workflow } from "@/db/schema";
import { ChatAgent } from "@/components/chat-agent";
import { VoiceAgent } from "@/components/voice-agent";
import { cn } from "@/lib/utils";

type SimulatorWorkflow = Pick<Workflow, "id" | "businessId"> & {
  greeting: string;
  closingMessage: string;
  language: string;
};

export function SimulatorModeToggle({
  mode: initialMode,
  workflow,
}: {
  mode: "chat" | "voice";
  workflow: SimulatorWorkflow;
}) {
  const [mode, setMode] = useState<"chat" | "voice">(initialMode);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="inline-flex rounded-full border border-border bg-muted p-1">
          <button
            type="button"
            onClick={() => setMode("chat")}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              mode === "chat"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Chat Agent
          </button>
          <button
            type="button"
            onClick={() => setMode("voice")}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              mode === "voice"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Voice Agent
          </button>
        </div>
      </div>

      {mode === "chat" ? (
        <ChatAgent workflow={workflow} />
      ) : (
        <VoiceAgent workflow={workflow} />
      )}
    </div>
  );
}
