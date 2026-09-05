import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function getModel() {
  const apiKey = process.env.LLM_API_KEY;
  const endpoint = process.env.LLM_API_ENDPOINT;
  const modelId = process.env.LLM_MODEL;

  if (!apiKey) throw new Error("LLM_API_KEY is not set");
  if (!endpoint) throw new Error("LLM_API_ENDPOINT is not set");
  if (!modelId) throw new Error("LLM_MODEL is not set");

  return createOpenAICompatible({
    name: "agent",
    apiKey,
    baseURL: endpoint,
  }).chatModel(modelId);
}
