import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const { token } = await request.json();
    if (typeof token !== 'string' || !token.trim()) {
      return NextResponse.json({ error: '缺少邀请 token' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: projectId, error } = await supabase.rpc(
      'accept_project_invite',
      { p_token: token.trim() }
    );

    if (error) {
      const msg = error.message || '接受邀请失败';
      if (msg.includes('email mismatch')) {
        return NextResponse.json(
          { error: '请使用受邀邮箱登录后再接受邀请' },
          { status: 403 }
        );
      }
      if (msg.includes('invite not found')) {
        return NextResponse.json({ error: '邀请不存在' }, { status: 404 });
      }
      if (msg.includes('invite inactive')) {
        return NextResponse.json({ error: '邀请已失效' }, { status: 400 });
      }
      if (msg.includes('does not exist') || error.code === '42883') {
        return NextResponse.json(
          {
            error:
              '邀请功能未就绪：请配置 DATABASE_URL 后执行 npm run db:migrate:m0c',
          },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    await writeAuditLog(supabase, {
      projectId: projectId as string,
      actorId: auth.user.id,
      action: 'invite.accept',
      entityType: 'project_invite',
      entityId: token.trim(),
      meta: { email: auth.user.email },
    });

    return NextResponse.json({
      ok: true,
      projectId,
    });
  } catch (err) {
    console.error('accept invite failed:', err);
    return NextResponse.json({ error: '接受邀请失败' }, { status: 500 });
  }
}
