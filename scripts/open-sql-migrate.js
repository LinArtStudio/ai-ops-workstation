/**
 * Zero-config fallback for non-technical operators:
 * 1) Copy combined Stage A SQL to clipboard
 * 2) Open the correct Supabase SQL Editor page
 *
 * User only needs: Ctrl+V → click Run
 */
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

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
  return m?.[1] || 'vzcbwzislmenrlnugmih';
}

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
const onlyFile = process.argv.includes('--file')
  ? process.argv[process.argv.indexOf('--file') + 1]
  : null;
const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql') && !f.startsWith('_'))
  .filter((f) => !onlyFile || f === onlyFile)
  .sort();

if (!files.length) {
  console.error(onlyFile ? `File not found: ${onlyFile}` : 'No SQL files');
  process.exit(1);
}

const combined = files
  .map((f) => fs.readFileSync(path.join(migrationsDir, f), 'utf8'))
  .join('\n\n');

const outFile = path.join(migrationsDir, '_combined_stage_a.sql');
fs.writeFileSync(outFile, combined, 'utf8');

// Copy to Windows clipboard
const tmpPs1 = path.join(process.cwd(), 'scripts', '_clip-tmp.ps1');
fs.writeFileSync(
  tmpPs1,
  `$text = Get-Content -LiteralPath '${outFile.replace(/'/g, "''")}' -Raw -Encoding UTF8; Set-Clipboard -Value $text`,
  'utf8'
);
try {
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tmpPs1}"`, {
    stdio: 'inherit',
  });
} finally {
  try {
    fs.unlinkSync(tmpPs1);
  } catch {
    // ignore
  }
}

const ref = resolveProjectRef();
const editorUrl = `https://supabase.com/dashboard/project/${ref}/sql/new`;

// Open default browser
spawn('cmd', ['/c', 'start', '', editorUrl], {
  detached: true,
  stdio: 'ignore',
}).unref();

console.log(
  [
    `✓ SQL 已复制到剪贴板（${files.join(', ')}）`,
    `✓ 已打开 SQL Editor: ${editorUrl}`,
    '',
    '请你只做两步（约 10 秒）：',
    '1) 若未登录，先登录 Supabase；若弹出扩展错误，先关网页翻译再刷新',
    '2) 清空编辑器后按 Ctrl+V，再点绿色 Run',
    '',
    '成功时应看到 Success，且无红色报错。',
    '跑完后回复我：已执行',
  ].join('\n')
);
