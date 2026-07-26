import { NextRequest, NextResponse } from 'next/server';
import { requireProjectMembership } from '@/lib/tenancy';
import { generateInsightsFromFeedback } from '@/lib/ai';
import { aggregateWeekSummaries } from '@/lib/weekly-loop';
import { consumeAiQuota } from '@/lib/quota';

function defaultWeekRange() {
  const now = new Date();
  const day = now.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setUTCDate(now.getUTCDate() + diffToMonday);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  const toDate = (d: Date) => d.toISOString().slice(0, 10);
  return { start: toDate(start), end: toDate(end) };
}

export async function POST(request: NextRequest) {
  if (!process.env.ZHIPUAI_API_KEY) {
    return NextResponse.json({ error: 'AI 服务未配置' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { projectId, weekStart, weekEnd } = body;

    const access = await requireProjectMembership(projectId);
    if (access.error) return access.error;

    const quota = await consumeAiQuota(access.supabase, {
      projectId: access.projectId,
      user: access.user,
      feature: 'insights',
      units: 2,
    });
    if (!quota.ok) return quota.error;

    const range = {
      start: typeof weekStart === 'string' ? weekStart : defaultWeekRange().start,
      end: typeof weekEnd === 'string' ? weekEnd : defaultWeekRange().end,
    };

    const aggregated = await aggregateWeekSummaries(
      access.supabase,
      access.projectId,
      range
    );

    if (aggregated.feedbackCount === 0) {
      return NextResponse.json(
        {
          error: '本周暂无反馈，请先在「用户反馈」录入几条再生成洞察',
          insights: [],
          feedbackCount: 0,
        },
        { status: 400 }
      );
    }

    const insights = await generateInsightsFromFeedback(
      aggregated.feedbackSummary
    );

    return NextResponse.json({
      insights,
      feedbackCount: aggregated.feedbackCount,
      feedbackSummary: aggregated.feedbackSummary,
      weekStart: range.start,
      weekEnd: range.end,
      quota: quota.status,
    });
  } catch (error) {
    console.error('insights error:', error);
    return NextResponse.json({ error: '洞察生成失败' }, { status: 500 });
  }
}
