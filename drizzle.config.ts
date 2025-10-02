// drizzle.config.ts
import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config(); // load .env so DATABASE_URL is available

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Please check your .env file.");
}

export default defineConfig({
  out: "./migrations",              // migrations folder
  schema: "./shared/schema.ts",     // path to your Drizzle schema
  dialect: "postgresql",            // use PostgreSQL dialect
  dbCredentials: {
    url: process.env.DATABASE_URL!, // safe because we checked above
  },
});
