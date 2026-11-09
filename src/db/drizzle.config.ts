import { defineConfig } from "drizzle-kit";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_V5RbxQ6qipkM@ep-blue-union-bdoeb2yb-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
