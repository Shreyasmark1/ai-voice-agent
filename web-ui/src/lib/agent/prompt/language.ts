export const LANGUAGE_INSTRUCTIONS: Record<string, { name: string; instruction: string }> = {
  "en-IN": {
    name: "English",
    instruction:
      "You must respond in clear, friendly, natural English. Use a spoken, conversational tone as if on a phone call.",
  },
  "hi-IN": {
    name: "Hindi",
    instruction:
      "You must respond entirely in Hindi (Hinglish/Hindi script is fine, but keep it natural and spoken). The conversation is for Hindi speakers.",
  },
  "ta-IN": {
    name: "Tamil",
    instruction:
      "You must respond entirely in Tamil. Use natural, spoken Tamil suitable for a phone conversation.",
  },
  "te-IN": {
    name: "Telugu",
    instruction:
      "You must respond entirely in Telugu. Use natural, spoken Telugu suitable for a phone conversation.",
  },
  "kn-IN": {
    name: "Kannada",
    instruction:
      "You must respond entirely in Kannada. Use natural, spoken Kannada suitable for a phone conversation.",
  },
  "ml-IN": {
    name: "Malayalam",
    instruction:
      "You must respond entirely in Malayalam. Use natural, spoken Malayalam suitable for a phone conversation.",
  },
  "mr-IN": {
    name: "Marathi",
    instruction:
      "You must respond entirely in Marathi. Use natural, spoken Marathi suitable for a phone conversation.",
  },
  "gu-IN": {
    name: "Gujarati",
    instruction:
      "You must respond entirely in Gujarati. Use natural, spoken Gujarati suitable for a phone conversation.",
  },
  "bn-IN": {
    name: "Bengali",
    instruction:
      "You must respond entirely in Bengali. Use natural, spoken Bengali suitable for a phone conversation.",
  },
  "pa-IN": {
    name: "Punjabi",
    instruction:
      "You must respond entirely in Punjabi. Use natural, spoken Punjabi suitable for a phone conversation.",
  },
  "od-IN": {
    name: "Odia",
    instruction:
      "You must respond entirely in Odia. Use natural, spoken Odia suitable for a phone conversation.",
  },
};

export function getLanguageInstruction(language: string): { name: string; instruction: string } {
  return (
    LANGUAGE_INSTRUCTIONS[language] ?? {
      name: language,
      instruction: `You must respond entirely in the language "${language}". Keep it natural and spoken.`,
    }
  );
}