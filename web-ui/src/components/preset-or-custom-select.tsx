"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PresetOption = { value: string; label: string };

const CUSTOM_VALUE = "__custom__";

export function PresetOrCustomSelect({
  label,
  value,
  onChange,
  presets,
  customPlaceholder,
  helpText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  presets: PresetOption[];
  customPlaceholder?: string;
  helpText?: string;
}) {
  const isCustom = !presets.some((p) => p.value === value);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select
        value={isCustom ? CUSTOM_VALUE : value}
        onChange={(e) => {
          if (e.target.value === CUSTOM_VALUE) {
            onChange("");
          } else {
            onChange(e.target.value);
          }
        }}
        className="h-10 w-full rounded-xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {presets.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
        <option value={CUSTOM_VALUE}>Other (type below)</option>
      </select>
      {isCustom && (
        <Input
          value={value}
          placeholder={customPlaceholder ?? "Enter a value"}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {helpText && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}