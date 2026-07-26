-- M0c: project invites + audit logs (Stage A remaining)
-- Idempotent; safe to re-run

CREATE TABLE IF NOT EXISTS project_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_project_invites_project
  ON project_invites(project_id);

CREATE INDEX IF NOT EXISTS idx_project_invites_email
  ON project_invites(lower(email));

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_project_created
  ON audit_logs(project_id, created_at DESC);

ALTER TABLE project_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invites_select_owner" ON project_invites;
DROP POLICY IF EXISTS "invites_insert_owner" ON project_invites;
DROP POLICY IF EXISTS "invites_update_owner" ON project_invites;
DROP POLICY IF EXISTS "invites_select_invitee" ON project_invites;
DROP POLICY IF EXISTS "invites_accept_invitee" ON project_invites;

DROP POLICY IF EXISTS "members_insert_via_invite" ON project_members;

DROP POLICY IF EXISTS "audit_select_member" ON audit_logs;
DROP POLICY IF EXISTS "audit_insert_actor" ON audit_logs;

DROP FUNCTION IF EXISTS public.accept_project_invite(text);

-- Owners manage invites for their projects
CREATE POLICY "invites_select_owner" ON project_invites
  FOR SELECT TO authenticated
  USING (public.is_project_owner(project_id));

CREATE POLICY "invites_insert_owner" ON project_invites
  FOR INSERT TO authenticated
  WITH CHECK (public.is_project_owner(project_id));

CREATE POLICY "invites_update_owner" ON project_invites
  FOR UPDATE TO authenticated
  USING (public.is_project_owner(project_id))
  WITH CHECK (public.is_project_owner(project_id));

-- Invitee can read their own pending invite (accept page)
CREATE POLICY "invites_select_invitee" ON project_invites
  FOR SELECT TO authenticated
  USING (
    status = 'pending'
    AND expires_at > NOW()
    AND lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
  );

-- Accept path is RPC-only (no invitee UPDATE policy) to prevent
-- rewriting project_id/role via direct table updates.
CREATE OR REPLACE FUNCTION public.accept_project_invite(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.project_invites%ROWTYPE;
  v_uid uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt()->>'email', ''));
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF p_token IS NULL OR length(trim(p_token)) = 0 THEN
    RAISE EXCEPTION 'missing token';
  END IF;

  SELECT * INTO v_invite
  FROM public.project_invites
  WHERE token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invite not found';
  END IF;

  IF v_invite.status <> 'pending' OR v_invite.expires_at <= NOW() THEN
    RAISE EXCEPTION 'invite inactive';
  END IF;

  IF lower(v_invite.email) <> v_email THEN
    RAISE EXCEPTION 'email mismatch';
  END IF;

  INSERT INTO public.project_members (project_id, user_id, role)
  VALUES (
    v_invite.project_id,
    v_uid,
    CASE WHEN v_invite.role = 'owner' THEN 'owner' ELSE 'member' END
  )
  ON CONFLICT (project_id, user_id) DO NOTHING;

  UPDATE public.project_invites
  SET status = 'accepted',
      accepted_at = NOW()
  WHERE id = v_invite.id
    AND status = 'pending';

  RETURN v_invite.project_id;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_project_invite(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_project_invite(text) TO authenticated;

CREATE POLICY "audit_select_member" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    project_id IS NOT NULL AND public.is_project_member(project_id)
  );

CREATE POLICY "audit_insert_actor" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND (
      project_id IS NULL
      OR public.is_project_member(project_id)
    )
  );
