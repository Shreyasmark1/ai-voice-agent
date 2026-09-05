"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

import type { Workflow } from "@/db/schema";
import {
  finalizeAgentConversationAction,
  startConversationAction,
} from "@/lib/actions/conversation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

type AgentWorkflow = Pick<Workflow, "id" | "businessId"> & {
  greeting: string;
  closingMessage: string;
};

import { TOOL_SUMMARY } from "@/lib/tools";

export function ChatAgent({ workflow }: { workflow: AgentWorkflow }) {
  const router = useRouter();
  const [callerName, setCallerName] = useState("");
  const [callerPhone, setCallerPhone] = useState("");
  const [started, setStarted] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [finalizing, setFinalizing] = useState(false);
  const [saved, setSaved] = useState(false);

  const { messages, sendMessage, status, setMessages, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/agent/chat",
      body: { workflowId: workflow.id },
    }),
  });

  const finalizingRef = useRef(false);

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (starting) return;
    setStarting(true);
    setStartError(null);
    try {
      const { conversationId: id } = await startConversationAction({
        workflowId: workflow.id,
        callerName,
        callerPhone,
      });
      setConversationId(id);
      setStarted(true);
      setMessages([
        {
          id: "greeting",
          role: "assistant" as const,
          parts: [{ type: "text" as const, text: workflow.greeting }],
        },
      ]);
    } catch (err) {
      setStartError(
        err instanceof Error ? err.message : "Could not start the call"
      );
    } finally {
      setStarting(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || status !== "ready") return;
    void sendMessage({ text: input.trim() });
    setInput("");
  }

  const hasClosing = useMemo(() => {
    const last = messages.filter((m) => m.role === "assistant").at(-1);
    if (!last) return false;
    const text = last.parts
      .filter((p) => p.type === "text")
      .map((p) => (p as { text?: string }).text ?? "")
      .join(" ")
      .trim();
    const closing = workflow.closingMessage.trim();
    if (!text || !closing) return false;
    // The greeting must not trigger auto-save; only the configured closing message.
    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
    const t = norm(text);
    const c = norm(closing);
    return t === c || t.includes(c) || c.includes(t);
  }, [messages, workflow.closingMessage]);

  const busy = status !== "ready" && status !== "streaming";
  const streaming = status === "streaming";

  const doFinalize = useCallback(async () => {
    setFinalizing(true);
    try {
      await finalizeAgentConversationAction({
        workflowId: workflow.id,
        messages: messages,
        simulated: true,
        callerName: callerName,
        callerPhone: callerPhone,
        conversationId: conversationId,
      });
      setSaved(true);
      router.refresh();
    } catch (err) {
      console.error("Save failed", err);
      setSaved(false);
    } finally {
      setFinalizing(false);
      finalizingRef.current = false;
    }
  }, [messages, router, workflow.id, callerName, callerPhone, conversationId]);

  // Auto-save once the model produces the closing message and the stream settles.
  useEffect(() => {
    if (
      !started ||
      !hasClosing ||
      streaming ||
      status !== "ready" ||
      saved ||
      finalizingRef.current
    ) {
      return;
    }
    finalizingRef.current = true;
    void doFinalize();
  }, [started, hasClosing, streaming, status, saved, doFinalize]);

  const reset = useCallback(() => {
    setStarted(false);
    setSaved(false);
    setFinalizing(false);
    finalizingRef.current = false;
    setConversationId(null);
    setStartError(null);
    setMessages([]);
    setInput("");
    setCallerName("");
    setCallerPhone("");
  }, [setMessages]);

  if (!started) {
    return (
      <form
        onSubmit={handleStart}
        className="space-y-5 rounded-3xl border border-border bg-card p-6"
      >
        <div>
          <h2 className="font-semibold">Start an AI-powered missed call</h2>
          <p className="text-sm text-muted-foreground">
            This call is handled by an AI voice agent that asks for the details
            your workflow needs and can book slots on the business calendar.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="agent-caller-name">Caller name (optional)</Label>
            <Input
              id="agent-caller-name"
              value={callerName}
              onChange={(e) => setCallerName(e.target.value)}
              placeholder="e.g. Priya Sharma"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="agent-caller-phone">Caller phone (optional)</Label>
            <Input
              id="agent-caller-phone"
              value={callerPhone}
              onChange={(e) => setCallerPhone(e.target.value)}
              placeholder="e.g. 98765 43210"
            />
          </div>
        </div>

        {startError && (
          <p className="text-sm text-destructive">{startError}</p>
        )}
        {error && (
          <p className="text-sm text-destructive">
            Could not start the agent. Check your API key configuration.
          </p>
        )}

        <Button type="submit" className="w-full" disabled={starting}>
          {starting ? "Starting…" : "Start AI call"}
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="space-y-3">
          {messages.map((message) => (
            <MessageRow key={message.id} message={message} />
          ))}
          {streaming && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1.5 rounded-full bg-muted px-4 py-3">
                <Skeleton className="size-2 rounded-full" />
                <Skeleton
                  className="size-2 rounded-full"
                  style={{ animationDelay: "150ms" }}
                />
                <Skeleton
                  className="size-2 rounded-full"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          )}
          {error && (
            <div className="rounded-2xl border border-destructive/50 bg-destructive/10 px-4 py-3">
              <p className="text-sm text-destructive">
                {error.message || "Something went wrong. Please try again."}
              </p>
            </div>
          )}
        </div>
      </div>

      {saved ? (
        <div className="rounded-3xl border border-border bg-card p-6 text-center">
          <p className="font-medium">Call complete</p>
          <p className="text-sm text-muted-foreground">
            This conversation has been saved. Check the Records page.
          </p>
          <Button className="mt-4" onClick={reset}>
            Run another call
          </Button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex gap-2 rounded-3xl border border-border bg-card p-4"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Reply as the caller…"
            className="flex-1"
          />
          <Button type="submit" disabled={!input.trim() || streaming || busy}>
            Send
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={finalizing || streaming}
            onClick={() => doFinalize()}
          >
            {finalizing ? "Saving…" : "Finish & save"}
          </Button>
        </form>
      )}
    </div>
  );
}

function MessageRow({ message }: { message: { id: string; role: string; parts: { type: string; text?: string }[] } }) {
  const isUser = message.role === "user";
  const textParts = message.parts.filter((p) => p.type === "text");
  const toolNotes = message.parts
    .filter((p) => p.type.startsWith("tool-"))
    .map((p) => TOOL_SUMMARY[p.type.slice("tool-".length)])
    .filter(Boolean);

  const body = textParts.map((p) => p.text).join("\n");

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] space-y-1 rounded-2xl px-4 py-2 text-sm ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        {body && <p>{body}</p>}
        {toolNotes.map((note, i) => (
          <p key={i} className="text-xs font-medium opacity-80">
            {note}
          </p>
        ))}
      </div>
    </div>
  );
}