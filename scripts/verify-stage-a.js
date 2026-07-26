/**
 * Stage A automated checks:
 * 1) Migration SQL files exist and contain critical policies
 * 2) Required tables (M0 + M0c + M1) visible via API
 * 3) Optional live RLS isolation test when env credentials are present
 *
 * Live test needs:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   STAGE_A_USER_A_EMAIL / STAGE_A_USER_A_PASSWORD
 *   STAGE_A_USER_B_EMAIL / STAGE_A_USER_B_PASSWORD
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

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function verifySqlArtifacts() {
  const m0 = fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations/20260726_m0_auth_rls.sql'),
    'utf8'
  );
  const m0c = fs.readFileSync(
    path.join(
      process.cwd(),
      'supabase/migrations/20260726_m0c_invite_audit.sql'
    ),
    'utf8'
  );
  const m1 = fs.readFileSync(
    path.join(process.cwd(), 'supabase/migrations/20260726_m1_billing_quota.sql'),
    'utf8'
  );
  const m1b = fs.readFileSync(
    path.join(
      process.cwd(),
      'supabase/migrations/20260726_m1b_plan_team_quota_atomic.sql'
    ),
    'utf8'
  );

  assert(
    m0.indexOf('CREATE TABLE IF NOT EXISTS projects') <
      m0.indexOf('CREATE TABLE IF NOT EXISTS project_members'),
    'projects must be created before project_members'
  );
  assert(m0.includes('is_project_owner'), 'missing is_project_owner');
  assert(m0.includes('members_insert_owner'), 'missing members_insert_owner');
  assert(
    !/user_id = auth\.uid\(\)\s*OR EXISTS/s.test(
      m0.split('members_insert_owner')[1]?.slice(0, 400) || ''
    ),
    'members_insert_owner must not allow arbitrary self-join'
  );
  assert(m0c.includes('project_invites'), 'missing project_invites');
  assert(m0c.includes('audit_logs'), 'missing audit_logs');
  assert(m0c.includes('accept_project_invite'), 'missing accept_project_invite RPC');
  assert(
    !/CREATE POLICY\s+"invites_accept_invitee"/i.test(m0c),
    'invitee UPDATE policy must not be created'
  );
  assert(m1.includes('project_plans'), 'missing project_plans in M1');
  assert(m1.includes('ai_usage_events'), 'missing ai_usage_events in M1');
  assert(m1.includes("'free', 'pro', 'team'"), 'M1 plan check must include team');
  assert(m1b.includes('consume_ai_quota'), 'missing consume_ai_quota in M1b');
  console.log('✓ SQL artifacts look correct (M0/M0c/M1/M1b)');
}

async function probeTable(url, anon, table) {
  const r = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
    headers: { apikey: anon, Authorization: `Bearer ${anon}` },
  });
  return r.status;
}

async function verifyLiveIsolation() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const aEmail = process.env.STAGE_A_USER_A_EMAIL;
  const aPass = process.env.STAGE_A_USER_A_PASSWORD;
  const bEmail = process.env.STAGE_A_USER_B_EMAIL;
  const bPass = process.env.STAGE_A_USER_B_PASSWORD;

  if (!url || !anon || !aEmail || !aPass || !bEmail || !bPass) {
    console.log(
      '⚠ Live RLS test skipped (missing .env.local or STAGE_A_USER_* credentials)'
    );
    return { skipped: true };
  }

  const { createClient } = require('@supabase/supabase-js');
  const clientA = createClient(url, anon);
  const clientB = createClient(url, anon);

  const loginA = await clientA.auth.signInWithPassword({
    email: aEmail,
    password: aPass,
  });
  assert(!loginA.error && loginA.data.user, `User A login failed: ${loginA.error?.message}`);
  const loginB = await clientB.auth.signInWithPassword({
    email: bEmail,
    password: bPass,
  });
  assert(!loginB.error && loginB.data.user, `User B login failed: ${loginB.error?.message}`);

  const { data: projectsA, error: pErr } = await clientA
    .from('projects')
    .select('id, name')
    .eq('user_id', loginA.data.user.id)
    .limit(1);
  assert(!pErr && projectsA?.length, `User A has no project: ${pErr?.message}`);
  const projectId = projectsA[0].id;

  const { error: joinErr } = await clientB.from('project_members').insert({
    project_id: projectId,
    user_id: loginB.data.user.id,
    role: 'member',
  });
  assert(!!joinErr, 'SECURITY FAIL: User B self-joined User A project');

  const { data: leaked, error: readErr } = await clientB
    .from('feedback_items')
    .select('id')
    .eq('project_id', projectId)
    .limit(5);
  assert(!readErr, `Unexpected read error: ${readErr?.message}`);
  assert(!leaked?.length, 'SECURITY FAIL: User B can read User A feedback');

  console.log('✓ Live RLS isolation passed (A/B cannot cross-read or self-join)');
  return { skipped: false };
}

async function probeRequiredTables() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    console.log('⚠ Table probe skipped (no Supabase env)');
    return;
  }

  const requiredM0 = ['projects', 'project_members', 'feedback_items', 'reports'];
  const requiredM0c = ['project_invites', 'audit_logs'];
  const requiredM1 = ['project_plans', 'ai_usage_events'];
  const missing = [];

  for (const table of [...requiredM0, ...requiredM0c, ...requiredM1]) {
    const status = await probeTable(url, anon, table);
    if (status === 404) {
      missing.push(table);
      console.log(`✗ table missing: ${table}`);
    } else {
      console.log(`✓ table visible via API: ${table}`);
    }
  }

  if (missing.length) {
    throw new Error(
      `Required tables missing on connected Supabase: ${missing.join(
        ', '
      )}. Apply migrations in order: M0 → M0c → M1 → M1b (npm run db:open-sql).`
    );
  }
}

async function main() {
  verifySqlArtifacts();
  await probeRequiredTables();
  await verifyLiveIsolation();
  console.log('Stage A verification finished.');
}

main().catch((err) => {
  console.error('Stage A verification FAILED:', err.message || err);
  process.exit(1);
});
