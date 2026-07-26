/**
 * Apply SQL migrations without requiring DATABASE_URL.
 *
 * Preferred (easiest for humans):
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx   # Account → Access Tokens
 *   optional: SUPABASE_PROJECT_REF=vzcbwzislmenrlnugmih
 *
 * Fallback:
 *   DATABASE_URL / SUPABASE_DB_URL  # Postgres URI
 *
 * Usage:
 *   node scripts/apply-migrations.js
 *   node scripts/apply-migrations.js --file 20260726_m0c_invite_audit.sql
 */
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.join(process.cwd(), '.env.local'));
loadEnvFile(path.join(process.cwd(), '.env'));

function resolveProjectRef() {
  if (process.env.SUPABASE_PROJECT_REF) return process.env.SUPABASE_PROJECT_REF;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const m = url.match(/https?:\/\/([^.]+)\.supabase\.co/i);
  return m?.[1] || null;
}

function listSqlFiles() {
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  const onlyFile = process.argv.includes('--file')
    ? process.argv[process.argv.indexOf('--file') + 1]
    : null;

  return fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql') && !f.startsWith('_'))
    .filter((f) => !onlyFile || f === onlyFile)
    .sort()
    .map((f) => ({
      name: f,
      full: path.join(migrationsDir, f),
      sql: fs.readFileSync(path.join(migrationsDir, f), 'utf8'),
    }));
}

async function applyViaManagementApi(files) {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const ref = resolveProjectRef();
  if (!token) return false;
  if (!ref) {
    throw new Error(
      'SUPABASE_ACCESS_TOKEN is set, but project ref is missing. Set SUPABASE_PROJECT_REF or NEXT_PUBLIC_SUPABASE_URL.'
    );
  }

  console.log(`Using Management API for project ${ref}...`);

  for (const file of files) {
    process.stdout.write(`→ ${file.name} ... `);
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${ref}/database/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: file.sql }),
      }
    );
    const text = await response.text();
    if (!response.ok) {
      throw new Error(
        `Management API failed for ${file.name}: HTTP ${response.status} ${text.slice(0, 400)}`
      );
    }
    console.log('ok');
  }
  return true;
}

async function applyViaPostgres(files) {
  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.SUPABASE_DATABASE_URL;
  if (!dbUrl) return false;

  let pg;
  try {
    pg = require('pg');
  } catch {
    throw new Error('Missing dependency pg. Run: npm install pg --save-dev');
  }

  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log('Using DATABASE_URL via Postgres...');
  try {
    for (const file of files) {
      process.stdout.write(`→ ${file.name} ... `);
      await client.query(file.sql);
      console.log('ok');
    }
  } finally {
    await client.end();
  }
  return true;
}

async function main() {
  const files = listSqlFiles();
  if (!files.length) {
    console.error('No migration SQL files found.');
    process.exit(1);
  }

  if (await applyViaManagementApi(files)) {
    console.log('All migrations applied via Access Token.');
    return;
  }

  if (await applyViaPostgres(files)) {
    console.log('All migrations applied via DATABASE_URL.');
    return;
  }

  console.error(
    [
      'No credentials for auto migration.',
      '',
      'Easiest option (recommended):',
      '1) Open https://supabase.com/dashboard/account/tokens',
      '2) Generate token → paste into .env.local as:',
      '   SUPABASE_ACCESS_TOKEN=sbp_你的令牌',
      '3) Tell me: 已放好',
      '',
      'One-click fallback (no token):',
      '   npm run db:open-sql',
      'Then in the opened page: Ctrl+V → click Run',
    ].join('\n')
  );
  process.exit(1);
}

main().catch((err) => {
  console.error('Migration failed:', err.message || err);
  process.exit(1);
});
