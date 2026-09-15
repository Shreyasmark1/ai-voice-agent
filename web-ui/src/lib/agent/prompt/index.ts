import type {
  Business,
  Workflow,
  WorkflowField,
} from "@/db/schema";

import { formatBusinessIntro, formatConditionLines, formatFieldLines } from "./format";
import { getLanguageInstruction } from "./language";
import { fillSystemPrompt } from "./template";

export type AgentContext = {
  business: Business;
  workflow: Workflow;
  fields: WorkflowField[];
};

export type PromptOptions = {
  language?: string;
  closingMessageOverride?: string;
};

export function buildSystemPrompt(
  context: AgentContext,
  options: PromptOptions = {}
): string {
  const { business, workflow, fields } = context;
  const language = (options.language || "en-IN").toLowerCase();
  const closingMessage = options.closingMessageOverride ?? workflow.closingMessage;

  const lang = getLanguageInstruction(language);
  const fieldLines = formatFieldLines(fields) || "(none required)";
  const conditionLines = formatConditionLines(workflow.conditions ?? []) || "(none)";

  return fillSystemPrompt({
    businessIntro: formatBusinessIntro(business),
    languageInstruction: lang.instruction,
    languageName: lang.name,
    closingMessage,
    fieldLines,
    conditionLines,
  });
}