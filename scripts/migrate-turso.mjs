import { createClient } from "@libsql/client";
import { readFileSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TURSO_URL = process.env.TURSO_DATABASE_URL;
if (!TURSO_URL) {
  console.error("TURSO_DATABASE_URL env var is required");
  process.exit(1);
}

const client = createClient({ url: TURSO_URL });

// Split SQL into individual statements
function splitSQL(sql) {
  const statements = [];
  let current = "";
  for (const line of sql.split("\n")) {
    if (line.trim().startsWith("--")) continue; // skip comments
    const trimmed = line.trim();
    if (!trimmed) continue;
    current += (current ? " " : "") + trimmed;
    if (trimmed.endsWith(";")) {
      statements.push(current);
      current = "";
    }
  }
  if (current.trim()) statements.push(current);
  return statements;
}

// Create _prisma_migrations table if not exists
await client.execute(`
  CREATE TABLE IF NOT EXISTS _prisma_migrations (
    id VARCHAR(36) PRIMARY KEY,
    checksum VARCHAR(64) NOT NULL,
    finished_at DATETIME,
    migration_name VARCHAR(255) NOT NULL,
    logs TEXT,
    rolled_back_at DATETIME,
    started_at DATETIME NOT NULL DEFAULT current_timestamp,
    applied_steps_count INTEGER NOT NULL DEFAULT 0
  )
`);

const migrationsDir = path.join(__dirname, "..", "prisma", "migrations");
const dirs = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

for (const dirName of dirs) {
  const existing = await client.execute({
    sql: "SELECT id FROM _prisma_migrations WHERE migration_name = ?",
    args: [dirName],
  });
  if (existing.rows.length > 0) {
    console.log(`[SKIP] ${dirName} (already applied)`);
    continue;
  }

  const sqlPath = path.join(migrationsDir, dirName, "migration.sql");
  const sql = readFileSync(sqlPath, "utf-8");
  const stmts = splitSQL(sql);

  try {
    for (const stmt of stmts) {
      await client.execute(stmt);
    }
    await client.execute({
      sql: "INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, applied_steps_count) VALUES (?, ?, datetime('now'), ?, ?)",
      args: [crypto.randomUUID(), "", dirName, stmts.length],
    });
    console.log(`[OK]   ${dirName}`);
  } catch (err) {
    console.error(`[FAIL] ${dirName}:`, err.message);
  }
}

console.log("\nMigrations complete!");
