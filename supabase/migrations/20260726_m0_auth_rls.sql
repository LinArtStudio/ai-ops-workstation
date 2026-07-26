-- M0: Auth + project membership + real RLS
-- Run in Supabase Dashboard → SQL Editor
-- Safe to re-run on fresh or existing projects (IF NOT EXISTS + DROP POLICY IF EXISTS)

-- 1) Core tables FIRST (project_members FK depends on projects)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_user
  ON project_members(user_id);

CREATE INDEX IF NOT EXISTS idx_project_members_project
  ON project_members(project_id);

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

CREATE TABLE IF NOT EXISTS metrics (
  id BIGSERIAL PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  dimension JSONB,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- 2) Membership helper (SECURITY DEFINER avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = p_project_id
      AND pm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = p_project_id
      AND p.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_project_owner(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = p_project_id
      AND p.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = p_project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'owner'
  );
$$;

REVOKE ALL ON FUNCTION public.is_project_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_project_member(UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.is_project_owner(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_project_owner(UUID) TO authenticated;

-- 3) Drop legacy open / previous M0 policies if present
DROP POLICY IF EXISTS "Allow all operations on projects" ON projects;
DROP POLICY IF EXISTS "Allow all operations on metrics" ON metrics;
DROP POLICY IF EXISTS "Allow all operations on feedback_items" ON feedback_items;
DROP POLICY IF EXISTS "Allow all operations on competitors" ON competitors;
DROP POLICY IF EXISTS "Allow all operations on reports" ON reports;
DROP POLICY IF EXISTS "Allow all operations on experiments" ON experiments;

DROP POLICY IF EXISTS "projects_select_member" ON projects;
DROP POLICY IF EXISTS "projects_insert_own" ON projects;
DROP POLICY IF EXISTS "projects_update_own" ON projects;
DROP POLICY IF EXISTS "projects_delete_own" ON projects;

DROP POLICY IF EXISTS "members_select" ON project_members;
DROP POLICY IF EXISTS "members_insert_owner" ON project_members;
DROP POLICY IF EXISTS "members_delete_owner" ON project_members;
DROP POLICY IF EXISTS "members_update_owner" ON project_members;

DROP POLICY IF EXISTS "feedback_member_all" ON feedback_items;
DROP POLICY IF EXISTS "metrics_member_all" ON metrics;
DROP POLICY IF EXISTS "competitors_member_all" ON competitors;
DROP POLICY IF EXISTS "reports_member_all" ON reports;
DROP POLICY IF EXISTS "experiments_member_all" ON experiments;

-- 4) Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;

-- 5) Projects policies
CREATE POLICY "projects_select_member" ON projects
  FOR SELECT TO authenticated
  USING (public.is_project_member(id) OR user_id = auth.uid());

CREATE POLICY "projects_insert_own" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "projects_update_own" ON projects
  FOR UPDATE TO authenticated
  USING (public.is_project_owner(id))
  WITH CHECK (public.is_project_owner(id));

CREATE POLICY "projects_delete_own" ON projects
  FOR DELETE TO authenticated
  USING (public.is_project_owner(id));

-- 6) Membership policies
-- IMPORTANT: only project owners may insert members.
-- This blocks any authenticated user from self-joining arbitrary projects.
CREATE POLICY "members_select" ON project_members
  FOR SELECT TO authenticated
  USING (public.is_project_member(project_id));

CREATE POLICY "members_insert_owner" ON project_members
  FOR INSERT TO authenticated
  WITH CHECK (public.is_project_owner(project_id));

CREATE POLICY "members_update_owner" ON project_members
  FOR UPDATE TO authenticated
  USING (public.is_project_owner(project_id))
  WITH CHECK (public.is_project_owner(project_id));

CREATE POLICY "members_delete_owner" ON project_members
  FOR DELETE TO authenticated
  USING (public.is_project_owner(project_id));

-- 7) Resource policies (member-scoped)
CREATE POLICY "feedback_member_all" ON feedback_items
  FOR ALL TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

CREATE POLICY "metrics_member_all" ON metrics
  FOR ALL TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

CREATE POLICY "competitors_member_all" ON competitors
  FOR ALL TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

CREATE POLICY "reports_member_all" ON reports
  FOR ALL TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

CREATE POLICY "experiments_member_all" ON experiments
  FOR ALL TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

-- 8) Backfill membership for existing project owners
INSERT INTO project_members (project_id, user_id, role)
SELECT p.id, p.user_id, 'owner'
FROM projects p
WHERE p.user_id IS NOT NULL
ON CONFLICT (project_id, user_id) DO NOTHING;
