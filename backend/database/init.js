import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use direct (unpooled) connection for schema migrations per Neon best practices
const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Missing DATABASE_URL_UNPOOLED or DATABASE_URL in backend/.env');
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to Neon PostgreSQL (direct).');

    const schemaSql = await fs.readFile(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schemaSql);
    console.log('Schema applied successfully.');

    const seedSql = await fs.readFile(path.join(__dirname, 'seed.sql'), 'utf8');
    await client.query(seedSql);
    console.log('Seed data applied successfully.');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
