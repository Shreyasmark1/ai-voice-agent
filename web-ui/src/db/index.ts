import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";
import { buildPgConfig } from "@/lib/db-neon";

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL is not set. Add it to your environment or .env.local.",
  );
}

const config = await buildPgConfig(url);
const pool = new Pool(config);

export const db = drizzle(pool, { schema });