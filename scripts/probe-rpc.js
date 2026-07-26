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

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('missing supabase env');

  const res = await fetch(`${url}/rest/v1/rpc/consume_ai_quota`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_project_id: '00000000-0000-0000-0000-000000000000',
      p_feature: 'probe',
      p_units: 1,
      p_meta: null,
    }),
  });
  const text = await res.text();
  console.log('status', res.status);
  console.log(text.slice(0, 400));

  // 404 + missing function => fail; 401/400/403/PGRST or SQLSTATE => function exists
  if (res.status === 404 && /Could not find the function|PGRST202/i.test(text)) {
    process.exit(1);
  }
  console.log('✓ consume_ai_quota RPC is reachable');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
