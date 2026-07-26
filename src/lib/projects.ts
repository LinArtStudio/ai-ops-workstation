import type { SupabaseClient } from '@supabase/supabase-js';
import type { Project } from '@/types/database';
import { defaultQuotaForPlan, envPlanOverride } from '@/lib/plans';

const ACTIVE_PROJECT_KEY = 'aos_active_project_id';

export function getStoredProjectId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACTIVE_PROJECT_KEY);
}

export function setStoredProjectId(projectId: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);
}

/**
 * Ensure the signed-in user has at least one project and an owner membership.
 * Returns the preferred project (stored id if still accessible, else first).
 */
export async function ensureDefaultProject(
  supabase: SupabaseClient,
  userId: string,
  preferredProjectId?: string | null
): Promise<Project> {
  const projects = await listUserProjects(supabase, userId);

  if (projects.length > 0) {
    const preferred =
      (preferredProjectId &&
        projects.find((p) => p.id === preferredProjectId)) ||
      projects[0];

    // Only backfill owner membership for projects this user owns.
    if (preferred.user_id === userId) {
      await ensureMembership(supabase, preferred.id, userId, 'owner');
    }
    return preferred;
  }

  return createProject(supabase, userId, {
    name: '默认项目',
    description: '注册后自动创建的工作区',
  });
}

export async function listUserProjects(
  supabase: SupabaseClient,
  userId: string
): Promise<Project[]> {
  const byId = new Map<string, Project>();

  const { data: owned, error: ownedError } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (ownedError) {
    throw ownedError;
  }

  for (const row of owned || []) {
    byId.set(row.id, row as Project);
  }

  const { data: memberRows, error: memberError } = await supabase
    .from('project_members')
    .select('project_id, projects(*)')
    .eq('user_id', userId);

  if (!memberError && memberRows) {
    for (const row of memberRows) {
      const project = row.projects as unknown as Project | Project[] | null;
      const resolved = Array.isArray(project) ? project[0] : project;
      if (resolved?.id) {
        byId.set(resolved.id, resolved);
      }
    }
  }

  return Array.from(byId.values()).sort((a, b) =>
    a.created_at.localeCompare(b.created_at)
  );
}

export async function createProject(
  supabase: SupabaseClient,
  userId: string,
  input: { name: string; description?: string }
): Promise<Project> {
  const { data: created, error: createError } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description || null,
    })
    .select()
    .single();

  if (createError || !created) {
    throw createError || new Error('创建项目失败');
  }

  await ensureMembership(supabase, created.id, userId, 'owner');

  // Seed plan (env PRO_/TEAM_PROJECT_IDS can override at create time)
  const plan = envPlanOverride(created.id) || 'free';
  const { error: planError } = await supabase.from('project_plans').insert({
    project_id: created.id,
    plan,
    ai_quota_monthly: defaultQuotaForPlan(plan),
  });
  if (planError && !/does not exist|PGRST205/i.test(planError.message || '')) {
    console.warn('seed project_plans failed:', planError.message);
  }

  return created as Project;
}

async function ensureMembership(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
  role: 'owner' | 'member'
) {
  const { data: existing } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    return;
  }

  const { error } = await supabase.from('project_members').insert({
    project_id: projectId,
    user_id: userId,
    role,
  });

  if (error && !error.message?.includes('does not exist')) {
    console.warn('ensureMembership failed:', error.message);
  }
}

export function createInviteToken(): string {
  const bytes = new Uint8Array(24);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
