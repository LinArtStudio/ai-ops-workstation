// 临时API：执行数据库迁移
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const migrateSecret = process.env.MIGRATE_SECRET || '';

export async function GET(request: NextRequest) {
  // 安全检查1：仅在开发环境或有service key时执行
  if (!supabaseServiceKey) {
    return NextResponse.json({ 
      error: 'Service role key not configured',
      message: 'Please add SUPABASE_SERVICE_ROLE_KEY to .env.local'
    }, { status: 400 });
  }

  // 安全检查2：生产环境需要提供密钥
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!migrateSecret || token !== migrateSecret) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'Production environment requires MIGRATE_SECRET'
      }, { status: 401 });
    }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

  try {
    // 使用rpc执行SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // 如果rpc不存在，尝试直接查询
      return NextResponse.json({ 
        error: 'RPC not available',
        message: 'Please execute the SQL manually in Supabase Dashboard',
        sql: sql
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database tables created successfully',
      data 
    });
  } catch (err) {
    return NextResponse.json({ 
      error: 'Execution failed',
      message: 'Please execute the SQL manually in Supabase Dashboard',
      details: err
    }, { status: 500 });
  }
}
