import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';

export async function requireProjectMembership(
  projectId: unknown
): Promise<
  | { user: User; supabase: SupabaseClient; projectId: string; error: null }
  | { user: null; supabase: null; projectId: null; error: NextResponse }
> {
  const auth = await requireUser();
  if (auth.error || !auth.user) {
    return {
      user: null,
      supabase: null,
      projectId: null,
      error: auth.error!,
    };
  }

  if (typeof projectId !== 'string' || !projectId.trim()) {
    return {
      user: null,
      supabase: null,
      projectId: null,
      error: NextResponse.json({ error: '缺少 projectId' }, { status: 400 }),
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .maybeSingle();

  if (error) {
    return {
      user: null,
      supabase: null,
      projectId: null,
      error: NextResponse.json(
        { error: '校验项目权限失败' },
        { status: 500 }
      ),
    };
  }

  if (!data) {
    return {
      user: null,
      supabase: null,
      projectId: null,
      error: NextResponse.json(
        { error: '无权访问该项目或不存在' },
        { status: 403 }
      ),
    };
  }

  return {
    user: auth.user,
    supabase,
    projectId,
    error: null,
  };
}
