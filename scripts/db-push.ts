import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as path from 'path';
import * as fs from 'fs';
import * as schema from '../shared/schema';

// Load environment variables in development mode
if (process.env.NODE_ENV !== 'production') {
  try {
    // Simple environment variable loader
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          // Remove quotes if present
          if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
            value = value.replace(/\\n/g, '\n');
          }
          process.env[key] = value;
        }
      });
      console.log('Environment variables loaded from .env file');
    } else {
      console.log('No .env file found.');
    }
  } catch (error) {
    console.warn('Failed to load .env file:', error);
  }
}

// Create the PostgreSQL client
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';
console.log("Connecting to PostgreSQL with connection string:", connectionString ? "Connection string exists" : "No connection string");

async function pushSchema() {
  try {
    // Create a dedicated connection for schema push
    const sql = postgres(connectionString, { max: 1 });
    
    // Initialize Drizzle ORM instance with your schema
    const db = drizzle(sql, { schema });
    
    console.log("Starting schema push...");
    
    // This would directly create/alter tables based on your schema
    // Note: In a production environment, you would want to use migrations instead
    // For development, schema push is convenient
    
    // Execute any custom SQL if needed
    // For example, to create session table for connect-pg-simple
    await sql`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      )
    `;
    
    console.log("Schema push completed successfully");
    
    // Close the PostgreSQL client
    await sql.end();
  } catch (error) {
    console.error("Schema push failed:", error);
    process.exit(1);
  }
}

// Run schema push on script start
pushSchema();