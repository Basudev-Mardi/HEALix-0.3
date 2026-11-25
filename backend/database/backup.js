import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query } from '../src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runBackup() {
  console.log('Initiating automated Neon PostgreSQL backup metadata snapshot...');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, 'backups');
  await fs.mkdir(backupDir, { recursive: true });

  const tables = [
    'hospital_settings',
    'hospital_branches',
    'departments',
    'services',
    'facilities',
    'doctors',
    'doctor_schedules',
    'appointments',
    'users',
    'patients',
    'prescriptions',
    'lab_reports',
    'radiology_reports',
    'health_packages',
    'insurance_providers',
    'faqs',
    'audit_logs'
  ];

  const snapshot = {
    timestamp: new Date().toISOString(),
    database: 'Neon PostgreSQL',
    tables: {},
  };

  for (const table of tables) {
    try {
      const res = await query(`SELECT count(*) FROM ${table}`);
      snapshot.tables[table] = Number(res.rows[0].count);
    } catch {
      snapshot.tables[table] = 0;
    }
  }

  const backupFile = path.join(backupDir, `backup-summary-${timestamp}.json`);
  await fs.writeFile(backupFile, JSON.stringify(snapshot, null, 2), 'utf8');
  console.log(`Backup snapshot metadata recorded at ${backupFile}`);
  console.log('Snapshot summary:', snapshot.tables);
  process.exit(0);
}

runBackup().catch((err) => {
  console.error('Backup snapshot failed:', err);
  process.exit(1);
});
