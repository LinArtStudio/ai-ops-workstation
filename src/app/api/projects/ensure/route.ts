import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { ensureDefaultProject } from '@/lib/projects';

export async function POST() {
  const { user, error } = await requireUser();
  if (error) return error;

  try {
    const supabase = await createClient();
    const project = await ensureDefaultProject(supabase, user.id);
    return NextResponse.json({ project });
  } catch (err) {
    console.error('ensure project failed:', err);
    return NextResponse.json(
      { error: '创建默认项目失败，请确认已执行 M0 SQL 迁移' },
      { status: 500 }
    );
  }
}
