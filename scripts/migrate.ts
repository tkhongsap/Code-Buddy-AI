import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as path from 'path';
import * as fs from 'fs';

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

async function runMigration() {
  try {
    // Create a dedicated connection for migrations
    const migrationClient = postgres(connectionString, { max: 1 });
    
    // Initialize Drizzle ORM instance
    const db = drizzle(migrationClient);
    
    console.log("Starting database migration...");
    
    // Run the migrations (this will push your schema to the database)
    await migrate(db, { migrationsFolder: "migrations" });
    
    console.log("Migration completed successfully");
    
    // Close the PostgreSQL client
    await migrationClient.end();
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run migration on script start
runMigration();