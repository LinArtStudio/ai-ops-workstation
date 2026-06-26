# 数据库迁移指南

## 方法1：在Supabase Dashboard执行（推荐）

### 步骤：
1. 访问 https://supabase.com/dashboard
2. 使用GitHub账号登录
3. 进入项目 `vzcbwzislmenrlnugmih`
4. 点击左侧菜单 **"SQL Editor"**
5. 点击 **"New query"**
6. 复制下方SQL脚本并粘贴
7. 点击 **"Run"** 执行

### SQL脚本：

```sql
-- AI产品运营工作台 - 数据库表结构

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

-- 7. 启用RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;

-- 8. 创建策略（允许所有操作）
CREATE POLICY "Allow all operations on projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all operations on metrics" ON metrics FOR ALL USING (true);
CREATE POLICY "Allow all operations on feedback_items" ON feedback_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on competitors" ON competitors FOR ALL USING (true);
CREATE POLICY "Allow all operations on reports" ON reports FOR ALL USING (true);
CREATE POLICY "Allow all operations on experiments" ON experiments FOR ALL USING (true);
```

## 方法2：使用Service Role Key执行

如果你有Service Role Key，可以设置环境变量后执行脚本：

```bash
export SUPABASE_SERVICE_ROLE_KEY=your_key_here
node scripts/migrate.js
```

## 验证

执行完成后，在Supabase Dashboard的 **"Table Editor"** 中确认以下表已创建：
- projects
- metrics
- feedback_items
- competitors
- reports
- experiments
