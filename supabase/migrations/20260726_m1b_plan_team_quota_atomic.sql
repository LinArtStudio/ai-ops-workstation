-- M1b: rename plan agency→team; atomic AI quota consume
-- Idempotent. Run after M1.

-- 1) Allow 'team' in plan CHECK (drop legacy constraint, recreate)
DO $$
DECLARE
  cname TEXT;
BEGIN
  SELECT con.conname INTO cname
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'project_plans'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%plan%';

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.project_plans DROP CONSTRAINT %I', cname);
  END IF;
END $$;

UPDATE project_plans SET plan = 'team' WHERE plan = 'agency';

ALTER TABLE project_plans
  ADD CONSTRAINT project_plans_plan_check
  CHECK (plan IN ('free', 'pro', 'team'));

-- 2) Atomic consume: check remaining + insert usage in one transaction
CREATE OR REPLACE FUNCTION public.consume_ai_quota(
  p_project_id UUID,
  p_feature TEXT,
  p_units INTEGER DEFAULT 1,
  p_meta JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_plan TEXT;
  v_quota INTEGER;
  v_used INTEGER;
  v_units INTEGER := COALESCE(NULLIF(p_units, 0), 1);
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT public.is_project_member(p_project_id) THEN
    RAISE EXCEPTION 'not a member';
  END IF;

  IF v_units < 1 THEN
    v_units := 1;
  END IF;

  INSERT INTO project_plans (project_id, plan, ai_quota_monthly)
  VALUES (p_project_id, 'free', 50)
  ON CONFLICT (project_id) DO NOTHING;

  SELECT plan, ai_quota_monthly INTO v_plan, v_quota
  FROM project_plans
  WHERE project_id = p_project_id
  FOR UPDATE;

  SELECT COALESCE(SUM(units), 0)::INTEGER INTO v_used
  FROM ai_usage_events
  WHERE project_id = p_project_id
    AND created_at >= date_trunc('month', timezone('utc', now()))
    AND created_at < date_trunc('month', timezone('utc', now())) + INTERVAL '1 month';

  IF v_used + v_units > v_quota THEN
    RETURN jsonb_build_object(
      'ok', false,
      'plan', v_plan,
      'used', v_used,
      'quota', v_quota,
      'remaining', GREATEST(0, v_quota - v_used)
    );
  END IF;

  INSERT INTO ai_usage_events (project_id, user_id, feature, units, meta)
  VALUES (p_project_id, v_uid, p_feature, v_units, p_meta);

  RETURN jsonb_build_object(
    'ok', true,
    'plan', v_plan,
    'used', v_used + v_units,
    'quota', v_quota,
    'remaining', GREATEST(0, v_quota - v_used - v_units)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ai_quota(UUID, TEXT, INTEGER, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(UUID, TEXT, INTEGER, JSONB) TO authenticated;

NOTIFY pgrst, 'reload schema';
