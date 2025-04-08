import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

// Create postgres connection
const client = postgres(process.env.DATABASE_URL || "", {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10
});

// Create database interface with drizzle
export const db = drizzle(client, { schema });

// Direct SQL query client for admin tools and complex queries
export const pgClient = client;