// server/db.ts
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env at the top of db.ts
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import { NodePgDatabase } from "drizzle-orm/node-postgres";

let pool: Pool | undefined;
let db: NodePgDatabase<typeof schema>;

if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
  console.log("Connected to Postgres database");
} else {
  throw new Error("DATABASE_URL is required. Please set it in your .env file.");
}

export { pool, db };
