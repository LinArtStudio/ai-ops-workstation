// 数据库迁移脚本 - 在本地执行
// 使用方法: node scripts/migrate.js

const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://vzcbwzislmenrlnugmih.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key_here';

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
-- 1. 项目表
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 指标表
CREATE TABLE IF NOT EXISTS metrics (
  id BIGSERIAL PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  dimension JSONB,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metrics_project_name_time 
ON metrics(project_id, metric_name, recorded_at DESC);

-- 3. 反馈表
CREATE TABLE IF NOT EXISTS feedback_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  source TEXT DEFAULT 'manual',
  category TEXT,
  sentiment TEXT,
  priority INTEGER DEFAULT 3,
  status TEXT DEFAULT 'new',
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 竞品表
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT,
  features JSONB,
  pricing TEXT,
  strengths TEXT[],
  weaknesses TEXT[],
  notes TEXT,
  last_updated TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 周报表
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  content TEXT,
  metrics_summary JSONB,
  ai_insights TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 实验表
CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hypothesis TEXT,
  variant_a TEXT,
  variant_b TEXT,
  metric_name TEXT,
  result JSONB,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

async function migrate() {
  console.log('🚀 开始执行数据库迁移...');
  
  try {
    // 使用rpc执行SQL
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });
    
    if (error) {
      console.error('❌ RPC执行失败:', error.message);
      console.log('\n📋 请手动在Supabase Dashboard中执行以下SQL:');
      console.log('-------------------------------------------');
      console.log(sql);
      console.log('-------------------------------------------');
      console.log('\n📌 操作步骤:');
      console.log('1. 访问 https://supabase.com/dashboard');
      console.log('2. 登录你的账号');
      console.log('3. 进入项目 vzcbwzislmenrlnugmih');
      console.log('4. 点击左侧菜单 "SQL Editor"');
      console.log('5. 点击 "New query"');
      console.log('6. 粘贴上面的SQL并执行');
      return;
    }
    
    console.log('✅ 数据库迁移成功！');
    console.log('📊 结果:', data);
  } catch (err) {
    console.error('❌ 执行失败:', err.message);
    console.log('\n📋 请手动在Supabase Dashboard中执行SQL脚本');
  }
}

migrate();
