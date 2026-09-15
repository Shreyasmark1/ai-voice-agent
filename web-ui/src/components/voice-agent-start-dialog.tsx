"use client";

import { useState } from "react";

import { AGENT_LANGUAGES, SARVAM_VOICES, DEFAULT_LANGUAGE, DEFAULT_VOICE } from "@/lib/constants";
import { PresetOrCustomSelect } from "@/components/preset-or-custom-select";
import { Button } from "@/components/ui/button";

export function VoiceAgentStartDialog({
  open,
  onOpenChange,
  onConfirm,
  starting,
  initialLanguage = DEFAULT_LANGUAGE,
  initialVoice = DEFAULT_VOICE,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (opts: { language: string; voice: string }) => void;
  starting: boolean;
  initialLanguage?: string;
  initialVoice?: string;
}) {
  const [language, setLanguage] = useState(initialLanguage);
  const [voice, setVoice] = useState(initialVoice);

  if (!open) return null;

  const finalLanguage = language.trim() || DEFAULT_LANGUAGE;
  const finalVoice = voice.trim() || DEFAULT_VOICE;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => {
        if (!starting) onOpenChange(false);
      }}
    >
      <div
        className="w-full max-w-md space-y-5 rounded-3xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h2 className="font-semibold">Start a voice call</h2>
          <p className="text-sm text-muted-foreground">
            Choose how the voice agent should speak and respond.
          </p>
        </div>

        <PresetOrCustomSelect
          label="Conversation language"
          value={language}
          onChange={setLanguage}
          presets={AGENT_LANGUAGES.map((l) => ({ value: l.code, label: l.label }))}
          customPlaceholder="e.g. hi-IN"
          helpText="The agent will speak in this language. Saving a custom code uses it directly in the agent prompt."
        />

        <PresetOrCustomSelect
          label="Voice"
          value={voice}
          onChange={setVoice}
          presets={SARVAM_VOICES.map((v) => ({ value: v.id, label: v.label }))}
          customPlaceholder="e.g. openai:alloy"
          helpText="Sarvam voices are pre-listed. You can also type any other voice supported by your TTS provider."
        />

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            disabled={starting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-1"
            disabled={starting}
            onClick={() => onConfirm({ language: finalLanguage, voice: finalVoice })}
          >
            {starting ? "Starting…" : "Start call"}
          </Button>
        </div>
      </div>
    </div>
  );
}