import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import mysql from "mysql2/promise";

async function ensureMigrationsTable(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getApplied(conn) {
  const [rows] = await conn.query("SELECT filename FROM schema_migrations");
  return new Set(rows.map((row) => row.filename));
}

async function run() {
  const migrationsDir = path.resolve("migrations");
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "mentor_ai_grad",
    multipleStatements: true,
  });

  await ensureMigrationsTable(conn);
  const applied = await getApplied(conn);
  const files = (await fs.readdir(migrationsDir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await fs.readFile(path.join(migrationsDir, file), "utf8");
    await conn.beginTransaction();
    try {
      await conn.query(sql);
      await conn.query(
        "INSERT INTO schema_migrations (filename) VALUES (?)",
        [file],
      );
      await conn.commit();
      console.log(`Applied migration: ${file}`);
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  }

  await conn.end();
  console.log("Migrations complete.");
}

run().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exit(1);
});
