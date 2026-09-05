import { createHmac } from "crypto";

// Payload carried by a signed voice-agent call token, verified server-to-server
// by the endpoints the Python voice-agent calls.
export type CallTokenPayload = {
  call_id: string;
  workflow_id: string;
  user_id: string;
  language: string;
  iat: number;
  exp: number;
};

export function signToken<T extends Record<string, unknown> = CallTokenPayload>(
  payload: T
): string {
  const SECRET = process.env.VOICE_AGENT_SECRET || "";
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

export function verifyToken<T extends Record<string, unknown> = CallTokenPayload>(
  token: string
): T | null {
  const SECRET = process.env.VOICE_AGENT_SECRET || "";
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expected = createHmac("sha256", SECRET)
    .update(data)
    .digest("base64url");
  if (sig !== expected) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8")
    ) as T & { exp?: number };
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
