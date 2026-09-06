import * as dns from "node:dns";
import type { ConnectionConfig } from "pg";

// Resolves Neon hostnames to IPv4 (avoids hanging on unreachable IPv6 AAAA
// records, e.g. WSL2) and sends the required `options=endpoint=<id>` param,
// which a bare connection string cannot carry.
export async function buildPgConfig(url: string): Promise<ConnectionConfig> {
  const u = new URL(url.replace(/^postgres(ql)?:/, "https:"));
  const connectionConfig: ConnectionConfig = {
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, "") || "postgres",
    host: u.hostname,
    port: Number(u.port || 5432),
    ssl: { rejectUnauthorized: false },
  };

  if (String(u.hostname).endsWith("neon.tech")) {
    const endpointId = u.hostname.split(".")[0];
    try {
      const addr = await dns.promises.lookup(u.hostname, { family: 4 });
      connectionConfig.host = addr.address;
    } catch {
      // keep hostname if lookup fails
    }
    connectionConfig.options = `endpoint=${endpointId}`;
  }

  return connectionConfig;
}