const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
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

const tables = process.argv.slice(2);
const targets =
  tables.length > 0
    ? tables
    : [
        'projects',
        'project_members',
        'feedback_items',
        'reports',
        'project_invites',
        'audit_logs',
        'project_plans',
        'ai_usage_events',
      ];

async function check(table) {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const k = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const r = await fetch(`${u}/rest/v1/${table}?select=id&limit=1`, {
    headers: { apikey: k, Authorization: `Bearer ${k}` },
  });
  // project_plans PK is project_id, not id — retry without select if needed
  let status = r.status;
  let body = (await r.text()).replace(/\s+/g, ' ').slice(0, 140);
  if (status === 400 && /column/i.test(body)) {
    const r2 = await fetch(`${u}/rest/v1/${table}?select=*&limit=1`, {
      headers: { apikey: k, Authorization: `Bearer ${k}` },
    });
    status = r2.status;
    body = (await r2.text()).replace(/\s+/g, ' ').slice(0, 140);
  }
  const ok = status === 200;
  console.log(`${ok ? '✓' : '✗'} ${table}: HTTP ${status} ${body}`);
  return ok;
}

(async () => {
  let failed = 0;
  for (const t of targets) {
    const ok = await check(t);
    if (!ok) failed += 1;
  }
  if (failed) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
