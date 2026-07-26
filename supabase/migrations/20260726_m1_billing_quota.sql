-- M1: Stage B billing foundation — plans + AI quota usage
-- Idempotent

CREATE TABLE IF NOT EXISTS project_plans (
  project_id UUID PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  ai_quota_monthly INTEGER NOT NULL DEFAULT 50,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  feature TEXT NOT NULL,
  units INTEGER NOT NULL DEFAULT 1 CHECK (units > 0),
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_project_created
  ON ai_usage_events(project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_project_month
  ON ai_usage_events(project_id, created_at);

ALTER TABLE project_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plans_select_member" ON project_plans;
DROP POLICY IF EXISTS "plans_upsert_owner" ON project_plans;
DROP POLICY IF EXISTS "plans_update_owner" ON project_plans;
DROP POLICY IF EXISTS "usage_select_member" ON ai_usage_events;
DROP POLICY IF EXISTS "usage_insert_member" ON ai_usage_events;

CREATE POLICY "plans_select_member" ON project_plans
  FOR SELECT TO authenticated
  USING (public.is_project_member(project_id));

-- Owners can insert/update plan rows (manual upgrade path for Stage B)
CREATE POLICY "plans_insert_owner" ON project_plans
  FOR INSERT TO authenticated
  WITH CHECK (public.is_project_owner(project_id));

CREATE POLICY "plans_update_owner" ON project_plans
  FOR UPDATE TO authenticated
  USING (public.is_project_owner(project_id))
  WITH CHECK (public.is_project_owner(project_id));

CREATE POLICY "usage_select_member" ON ai_usage_events
  FOR SELECT TO authenticated
  USING (public.is_project_member(project_id));

CREATE POLICY "usage_insert_member" ON ai_usage_events
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_project_member(project_id)
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- Default free plan for existing projects
INSERT INTO project_plans (project_id, plan, ai_quota_monthly)
SELECT p.id, 'free', 50
FROM projects p
ON CONFLICT (project_id) DO NOTHING;

-- Helper: current-month usage units
CREATE OR REPLACE FUNCTION public.ai_usage_month(p_project_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(units), 0)::INTEGER
  FROM public.ai_usage_events
  WHERE project_id = p_project_id
    AND created_at >= date_trunc('month', timezone('utc', now()))
    AND created_at < date_trunc('month', timezone('utc', now())) + INTERVAL '1 month';
$$;

REVOKE ALL ON FUNCTION public.ai_usage_month(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ai_usage_month(UUID) TO authenticated;

-- Refresh PostgREST schema cache so new tables appear in API immediately
NOTIFY pgrst, 'reload schema';
