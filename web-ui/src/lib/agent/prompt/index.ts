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
  greeting?: string;
  closingMessageOverride?: string;
};

export function buildSystemPrompt(
  context: AgentContext,
  options: PromptOptions = {}
): string {
  const { business, workflow, fields } = context;
  const language = (options.language || "en-IN").toLowerCase();
  const closureOverride = options.closingMessageOverride ?? workflow.closingMessage;

  const lang = getLanguageInstruction(language);
  const fieldLines = formatFieldLines(fields) || "(none required)";
  const conditionLines = formatConditionLines(workflow.conditions ?? []) || "(none)";
  const greeting = options.greeting;
  const greetingInstruction = greeting
    ? `The call is just starting and the caller has not spoken yet.\nOpen the call by greeting them in ${lang.name}, saying exactly:\n"${greeting}"\n\n`
    : "";

  return fillSystemPrompt({
    greetingInstruction,
    businessIntro: formatBusinessIntro(business),
    languageInstruction: lang.instruction,
    languageName: lang.name,
    closingMessage: closureOverride,
    fieldLines,
    conditionLines,
  });
}