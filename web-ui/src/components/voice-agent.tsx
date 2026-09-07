"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PipecatClient } from "@pipecat-ai/client-js";
import { WebSocketTransport } from "@pipecat-ai/websocket-transport";

import type { Workflow } from "@/db/schema";
import { finalizeAgentConversationAction, startConversationAction } from "@/lib/actions/conversation";
import { TOOL_SUMMARY } from "@/lib/tools";
import { AgentProtobufFrameSerializer } from "@/lib/agent/protobuf-frame-serializer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AgentWorkflow = Pick<Workflow, "id" | "businessId"> & {
  greeting: string;
  closingMessage: string;
  language: string;
};

type TranscriptEntry = {
  role: "user" | "assistant";
  text: string;
  tool?: string;
};

type VoiceState = "idle" | "connecting" | "listening" | "thinking" | "speaking" | "ended";

const STATE_LABELS: Record<VoiceState, string> = {
  idle: "",
  connecting: "Connecting…",
  listening: "Listening — speak now",
  thinking: "Thinking…",
  speaking: "Speaking…",
  ended: "Call ended",
};

/** Resolves `promise` unless it takes longer than `ms`, in which case it rejects. */
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (v) => {
        window.clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        window.clearTimeout(timer);
        reject(e);
      }
    );
  });
}

/** Formats a number of seconds as mm:ss. */
function formatElapsed(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function VoiceAgent({ workflow }: { workflow: AgentWorkflow }) {
  const router = useRouter();
  const [callerName, setCallerName] = useState("");
  const [callerPhone, setCallerPhone] = useState("");
  const [started, setStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const clientRef = useRef<PipecatClient | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      clientRef.current?.disconnect();
      clientRef.current = null;
    };
  }, []);

  // Timer counts up from "Start a call" and runs regardless of connection state.
  useEffect(() => {
    if (!started || startTimeRef.current === null || state === "ended" || saved) {
      return;
    }
    const tick = () => setElapsed(Math.floor((Date.now() - startTimeRef.current!) / 1000));
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [started, state, saved]);

  const addTranscript = useCallback((entry: TranscriptEntry) => {
    setTranscript((prev) => [...prev, entry]);
  }, []);

  const makeClient = useCallback(() => {
    const client = new PipecatClient({
      transport: new WebSocketTransport({
        serializer: new AgentProtobufFrameSerializer(),
        recorderSampleRate: 16000,
        playerSampleRate: 16000,
      }),
      enableMic: true,
      enableCam: false,
      callbacks: {
        onConnected: () => {},
        onDisconnected: () => setState("ended"),
        onError: () => setError("Voice agent connection error"),
        onBotReady: () => setState("listening"),
        onBotStartedSpeaking: () => setState("speaking"),
        onBotStoppedSpeaking: () => setState("listening"),
        onUserTranscript: (data) => {
          if (data.final && data.text) {
            addTranscript({ role: "user", text: data.text });
            setState("thinking");
          }
        },
        onBotTranscript: (data) => {
          if (data.text) {
            addTranscript({ role: "assistant", text: data.text });
          }
          setState("listening");
        },
        onServerMessage: (data) => {
          if (typeof data?.tool === "string" && TOOL_SUMMARY[data.tool]) {
            addTranscript({ role: "assistant", text: "", tool: data.tool });
          }
        },
      },
    });
    clientRef.current = client;
    return client;
  }, [addTranscript]);

  const handleStart = useCallback(async () => {
    setError(null);
    setStarting(true);
    setState("connecting");
    startTimeRef.current = Date.now();
    setElapsed(0);

    try {
      // Record the call up-front so caller details survive connection failure.
      const { conversationId: id } = await startConversationAction({
        workflowId: workflow.id,
        callerName,
        callerPhone,
      });
      setConversationId(id);
      setStarted(true);

      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId: workflow.id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to start call");
      }
      const { token, wsUrl } = await res.json();

      const client = makeClient();
      await withTimeout(
        client.connect({ wsUrl, token }),
        45_000,
        "Timed out connecting to the voice agent. Try again."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start voice call");
      setState("idle");
    } finally {
      setStarting(false);
    }
  }, [workflow.id, callerName, callerPhone, makeClient]);

  const handleFinish = useCallback(async () => {
    setFinalizing(true);
    try {
      const messages = transcript
        .filter((entry) => !entry.tool)
        .map((entry, i) => ({
          id: `voice-${i}`,
          role: entry.role === "assistant" ? ("assistant" as const) : ("user" as const),
          parts: [{ type: "text" as const, text: entry.text }],
        }));

      await finalizeAgentConversationAction({
        workflowId: workflow.id,
        messages,
        callerName: callerName,
        callerPhone: callerPhone,
        conversationId: conversationId,
      });
      setSaved(true);
      router.refresh();
    } catch (err) {
      console.error("Save failed", err);
      setError("Failed to save call record");
    } finally {
      setFinalizing(false);
    }
  }, [transcript, workflow.id, router, callerName, callerPhone, conversationId]);

  const handleStop = useCallback(() => {
    clientRef.current?.disconnect();
    clientRef.current = null;
    setState("ended");
  }, []);

  const reset = useCallback(() => {
    clientRef.current?.disconnect();
    clientRef.current = null;
    setStarted(false);
    setStarting(false);
    setConversationId(null);
    setState("idle");
    setTranscript([]);
    setError(null);
    setFinalizing(false);
    setSaved(false);
    setCallerName("");
    setCallerPhone("");
    startTimeRef.current = null;
    setElapsed(0);
  }, []);

  if (!started) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleStart();
        }}
        className="space-y-5 rounded-3xl border border-border bg-card p-6"
      >
        <div>
          <h2 className="font-semibold">Start a voice call</h2>
          <p className="text-sm text-muted-foreground">
            Speak to an AI voice agent that asks for the details your workflow
            needs. Your microphone will be used to capture your voice.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="voice-caller-name">Caller name (optional)</Label>
            <Input
              id="voice-caller-name"
              value={callerName}
              onChange={(e) => setCallerName(e.target.value)}
              placeholder="e.g. Priya Sharma"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="voice-caller-phone">Caller phone (optional)</Label>
            <Input
              id="voice-caller-phone"
              value={callerPhone}
              onChange={(e) => setCallerPhone(e.target.value)}
              placeholder="e.g. 98765 43210"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={starting}>
          {starting ? "Starting…" : "Start voice call"}
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          {state === "listening" && (
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          )}
          {state === "thinking" && (
            <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
          )}
          {state === "speaking" && (
            <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
          )}
          {state === "connecting" && (
            <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
          )}
          <span className="text-sm text-muted-foreground">
            {STATE_LABELS[state]}
          </span>
          <span className="ml-auto font-mono text-sm tabular-nums text-muted-foreground">
            {formatElapsed(elapsed)}
          </span>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {transcript.map((entry, i) => (
            <div
              key={i}
              className={`flex ${entry.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  entry.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {entry.tool ? (
                  <p className="text-xs font-medium opacity-80">
                    {TOOL_SUMMARY[entry.tool]}
                  </p>
                ) : (
                  entry.text
                )}
              </div>
            </div>
          ))}
          {state === "connecting" && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-muted px-4 py-2 text-sm text-muted-foreground">
                Connecting to voice agent…
              </div>
            </div>
          )}
        </div>
      </div>

      {saved ? (
        <div className="rounded-3xl border border-border bg-card p-6 text-center">
          <p className="font-medium">Call saved</p>
          <p className="text-sm text-muted-foreground">
            This conversation has been saved. Check the Records page.
          </p>
          <Button className="mt-4" onClick={reset}>
            Run another call
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          {state !== "ended" ? (
            <Button
              type="button"
              variant="destructive"
              className="flex-1"
              onClick={handleStop}
            >
              End call
            </Button>
          ) : (
            <Button className="flex-1" onClick={reset}>
              Run another call
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            disabled={finalizing || transcript.length === 0}
            onClick={handleFinish}
          >
            {finalizing ? "Saving…" : "Finish & save"}
          </Button>
        </div>
      )}

      {error && !saved && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}
    </div>
  );
}
