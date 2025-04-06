import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import * as schema from "@shared/schema";

// Set up the client
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Export the database with our schema
export const db = drizzle(pool, { schema });