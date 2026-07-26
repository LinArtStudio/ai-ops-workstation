import { NextRequest, NextResponse } from 'next/server';
import { requireProjectMembership } from '@/lib/tenancy';
import { generateCompetitorAnalysis } from '@/lib/ai';
import { consumeAiQuota } from '@/lib/quota';

export async function POST(request: NextRequest) {
  if (!process.env.ZHIPUAI_API_KEY) {
    return NextResponse.json({ error: 'AI 服务未配置' }, { status: 503 });
  }

  try {
    const { competitorName, competitorInfo, projectId } = await request.json();

    const access = await requireProjectMembership(projectId);
    if (access.error) return access.error;

    if (!competitorName || typeof competitorName !== 'string') {
      return NextResponse.json({ error: '缺少竞品名称' }, { status: 400 });
    }

    const quota = await consumeAiQuota(access.supabase, {
      projectId: access.projectId,
      user: access.user,
      feature: 'competitor-analysis',
      units: 2,
    });
    if (!quota.ok) return quota.error;

    const analysis = await generateCompetitorAnalysis(
      competitorName,
      typeof competitorInfo === 'string' ? competitorInfo : ''
    );

    return NextResponse.json({ analysis, quota: quota.status });
  } catch (error) {
    console.error('competitor analysis error:', error);
    return NextResponse.json({ error: '竞品分析失败' }, { status: 500 });
  }
}
