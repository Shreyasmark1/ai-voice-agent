import { generateText, Output } from "ai";
import { z } from "zod";

import { getModel } from "@/lib/agent/model";
import { AGENT_LANGUAGES, DEFAULT_LANGUAGE } from "@/lib/constants";

const translationSchema = z.object({
  greeting: z.string().min(1),
  closingMessage: z.string().min(1),
});

export function languageLabel(code: string): string {
  const match = AGENT_LANGUAGES.find((l) => l.code === code);
  return match?.label ?? code;
}

export async function localizeGreetingAndClosing({
  greeting,
  closingMessage,
  language,
}: {
  greeting: string;
  closingMessage: string;
  language: string;
}): Promise<{ greeting: string; closingMessage: string }> {
  const lang = language || DEFAULT_LANGUAGE;
  if (lang === DEFAULT_LANGUAGE) {
    return { greeting, closingMessage };
  }

  const langName = languageLabel(lang);

  try {
    const { output } = await generateText({
      model: getModel(),
      prompt: `Translate the following two short customer-service messages into ${langName} (language code ${lang}).
              Keep the tone warm, natural, and suitable for a spoken phone call.
              greeting: ${JSON.stringify(greeting)}
              closingMessage: ${JSON.stringify(closingMessage)}`,
      output: Output.object({
        schema: translationSchema,
        name: "translation",
        description: "Translated greeting and closing message",
      }),
    });

    return {
      greeting: output.greeting,
      closingMessage: output.closingMessage,
    };
  } catch {
    return { greeting, closingMessage };
  }
}