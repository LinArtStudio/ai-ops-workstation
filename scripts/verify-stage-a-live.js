/**
 * Live Stage A checks using anon key from .env.local.
 * Creates two temporary users (requires email confirm disabled or autoconfirm).
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function ensureUser(client, email, password) {
  const login = await client.auth.signInWithPassword({ email, password });
  if (!login.error && login.data.user) return login.data.user;

  const signed = await client.auth.signUp({ email, password });
  if (signed.error) {
    throw new Error(`signup ${email} failed: ${signed.error.message}`);
  }
  if (!signed.data.session) {
    throw new Error(
      `signup ${email} needs email confirmation; disable confirm in Supabase Auth for automated tests`
    );
  }
  return signed.data.user;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  assert(url && anon, 'missing NEXT_PUBLIC_SUPABASE_* in .env.local');

  const stamp = Date.now();
  const password = `StageA_${stamp}_x`;
  const emailA = `stagea.a.${stamp}@mailinator.com`;
  const emailB = `stagea.b.${stamp}@mailinator.com`;

  const clientA = createClient(url, anon);
  const clientB = createClient(url, anon);

  const userA = await ensureUser(clientA, emailA, password);
  const userB = await ensureUser(clientB, emailB, password);
  console.log('✓ created/logged two temp users');

  const { data: project, error: pErr } = await clientA
    .from('projects')
    .insert({
      user_id: userA.id,
      name: `stage-a-${stamp}`,
      description: 'auto verify',
    })
    .select('*')
    .single();
  assert(!pErr && project, `create project failed: ${pErr?.message}`);

  const { error: memErr } = await clientA.from('project_members').insert({
    project_id: project.id,
    user_id: userA.id,
    role: 'owner',
  });
  // membership may already exist via trigger/app; ignore duplicates
  if (memErr && !/duplicate|unique/i.test(memErr.message)) {
    console.warn('membership insert warn:', memErr.message);
  }

  const { error: fbErr } = await clientA.from('feedback_items').insert({
    project_id: project.id,
    content: `stage-a feedback ${stamp}`,
    source: 'manual',
  });
  assert(!fbErr, `insert feedback failed: ${fbErr?.message}`);

  const { error: joinErr } = await clientB.from('project_members').insert({
    project_id: project.id,
    user_id: userB.id,
    role: 'member',
  });
  assert(!!joinErr, 'SECURITY FAIL: B self-joined A project');
  console.log('✓ B cannot self-join A project');

  const { data: leaked, error: readErr } = await clientB
    .from('feedback_items')
    .select('id, content')
    .eq('project_id', project.id);
  assert(!readErr, `unexpected read error: ${readErr?.message}`);
  assert(!leaked?.length, 'SECURITY FAIL: B can read A feedback');
  console.log('✓ B cannot read A feedback');

  // M0c presence
  const { error: inviteTableErr } = await clientA
    .from('project_invites')
    .select('id')
    .limit(1);
  if (inviteTableErr) {
    console.log('⚠ M0c not applied yet (project_invites missing):', inviteTableErr.message);
  } else {
    console.log('✓ project_invites table exists');
  }

  const { error: auditTableErr } = await clientA
    .from('audit_logs')
    .select('id')
    .limit(1);
  if (auditTableErr) {
    console.log('⚠ M0c not applied yet (audit_logs missing):', auditTableErr.message);
  } else {
    console.log('✓ audit_logs table exists');
  }

  console.log('Live Stage A checks finished.');
}

main().catch((err) => {
  console.error('LIVE VERIFY FAILED:', err.message || err);
  process.exit(1);
});
