import { NextRequest, NextResponse } from 'next/server';
import { requireProjectMembership } from '@/lib/tenancy';
import { createInviteToken } from '@/lib/projects';
import { writeAuditLog } from '@/lib/audit';

function appBaseUrl(request: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    request.nextUrl.origin ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('projectId');
  const access = await requireProjectMembership(projectId);
  if (access.error) return access.error;

  const { data: project } = await access.supabase
    .from('projects')
    .select('id, user_id')
    .eq('id', access.projectId)
    .maybeSingle();

  const isOwner = project?.user_id === access.user.id;
  if (!isOwner) {
    const { data: membership } = await access.supabase
      .from('project_members')
      .select('role')
      .eq('project_id', access.projectId)
      .eq('user_id', access.user.id)
      .maybeSingle();
    if (membership?.role !== 'owner') {
      return NextResponse.json({ error: '仅项目所有者可查看邀请' }, { status: 403 });
    }
  }

  const { data, error } = await access.supabase
    .from('project_invites')
    .select('id, email, role, status, token, expires_at, created_at')
    .eq('project_id', access.projectId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: error.message.includes('does not exist')
        ? '邀请功能未就绪，请先执行 npm run db:migrate:m0c'
        : '加载邀请失败' },
      { status: 500 }
    );
  }

  const base = appBaseUrl(request);
  const invites = (data || []).map((row) => ({
    ...row,
    inviteUrl: `${base}/invite/${row.token}`,
  }));

  return NextResponse.json({ invites });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, email, role = 'member' } = body;
    const access = await requireProjectMembership(projectId);
    if (access.error) return access.error;

    if (typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 });
    }

    if (role !== 'member' && role !== 'owner') {
      return NextResponse.json({ error: '角色无效' }, { status: 400 });
    }

    const { data: project } = await access.supabase
      .from('projects')
      .select('id, user_id, name')
      .eq('id', access.projectId)
      .maybeSingle();

    const isOwner = project?.user_id === access.user.id;
    if (!isOwner) {
      const { data: membership } = await access.supabase
        .from('project_members')
        .select('role')
        .eq('project_id', access.projectId)
        .eq('user_id', access.user.id)
        .maybeSingle();
      if (membership?.role !== 'owner') {
        return NextResponse.json({ error: '仅项目所有者可邀请成员' }, { status: 403 });
      }
    }

    const token = createInviteToken();
    const { data: invite, error } = await access.supabase
      .from('project_invites')
      .insert({
        project_id: access.projectId,
        email: email.trim().toLowerCase(),
        token,
        role,
        invited_by: access.user.id,
        status: 'pending',
      })
      .select('id, email, role, status, token, expires_at')
      .single();

    if (error || !invite) {
      return NextResponse.json(
        {
          error: error?.message?.includes('does not exist')
            ? '邀请功能未就绪，请先配置 DATABASE_URL 后执行 npm run db:migrate:m0c'
            : error?.message || '创建邀请失败',
        },
        { status: 500 }
      );
    }

    await writeAuditLog(access.supabase, {
      projectId: access.projectId,
      actorId: access.user.id,
      action: 'invite.create',
      entityType: 'project_invite',
      entityId: invite.id,
      meta: { email: invite.email, role: invite.role },
    });

    const inviteUrl = `${appBaseUrl(request)}/invite/${invite.token}`;
    return NextResponse.json({ invite, inviteUrl });
  } catch (err) {
    console.error('create invite failed:', err);
    return NextResponse.json({ error: '创建邀请失败' }, { status: 500 });
  }
}
