import { NextRequest, NextResponse } from 'next/server';
import { requireProjectMembership } from '@/lib/tenancy';
import { getQuotaStatus } from '@/lib/quota';

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('projectId');
  const access = await requireProjectMembership(projectId);
  if (access.error) return access.error;

  try {
    const status = await getQuotaStatus(access.supabase, access.projectId);
    return NextResponse.json({ quota: status });
  } catch (err) {
    console.error('quota status failed:', err);
    return NextResponse.json({ error: '读取额度失败' }, { status: 500 });
  }
}
