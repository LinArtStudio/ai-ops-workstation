@echo off
echo ========================================
echo   AI产品运营工作台 - 数据库迁移脚本
echo ========================================
echo.

echo [1/3] 正在安装依赖...
cd /d "%~dp0\.."
npm install @supabase/supabase-js --save 2>nul

echo [2/3] 正在执行数据库迁移...
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://vzcbwzislmenrlnugmih.supabase.co',
  'sb_pub...uA'
);

const tables = [
  `CREATE TABLE IF NOT EXISTS projects (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID, name TEXT NOT NULL, description TEXT, url TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS metrics (id BIGSERIAL PRIMARY KEY, project_id UUID REFERENCES projects(id) ON DELETE CASCADE, metric_name TEXT NOT NULL, metric_value NUMERIC NOT NULL, dimension JSONB, recorded_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE INDEX IF NOT EXISTS idx_metrics_project_name_time ON metrics(project_id, metric_name, recorded_at DESC)`,
  `CREATE TABLE IF NOT EXISTS feedback_items (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID REFERENCES projects(id) ON DELETE CASCADE, content TEXT NOT NULL, source TEXT DEFAULT 'manual', category TEXT, sentiment TEXT, priority INTEGER DEFAULT 3, status TEXT DEFAULT 'new', tags TEXT[], created_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS competitors (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID REFERENCES projects(id) ON DELETE CASCADE, name TEXT NOT NULL, url TEXT, features JSONB, pricing TEXT, strengths TEXT[], weaknesses TEXT[], notes TEXT, last_updated TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS reports (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID REFERENCES projects(id) ON DELETE CASCADE, week_start DATE NOT NULL, week_end DATE NOT NULL, content TEXT, metrics_summary JSONB, ai_insights TEXT[], created_at TIMESTAMPTZ DEFAULT NOW())`,
  `CREATE TABLE IF NOT EXISTS experiments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID REFERENCES projects(id) ON DELETE CASCADE, name TEXT NOT NULL, hypothesis TEXT, variant_a TEXT, variant_b TEXT, metric_name TEXT, result JSONB, status TEXT DEFAULT 'draft', created_at TIMESTAMPTZ DEFAULT NOW())`
];

async function migrate() {
  console.log('正在创建数据表...');
  for (const sql of tables) {
    const { error } = await supabase.rpc('exec_sql', { query: sql });
    if (error) {
      console.log('注意: 需要在Supabase Dashboard中手动执行SQL');
      console.log('请访问: https://supabase.com/dashboard/project/vzcbwzislmenrlnugmih/sql');
      process.exit(1);
    }
  }
  console.log('数据表创建成功！');
}

migrate().catch(console.error);
"

echo [3/3] 完成！
echo.
echo 如果上面显示需要手动执行，请访问:
echo https://supabase.com/dashboard/project/vzcbwzislmenrlnugmih/sql
echo.
pause
