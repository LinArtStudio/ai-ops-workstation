import { NextRequest, NextResponse } from 'next/server';
import { requireProjectMembership } from '@/lib/tenancy';
import { generateWeeklyReport } from '@/lib/ai';
import { aggregateWeekSummaries } from '@/lib/weekly-loop';
import { writeAuditLog } from '@/lib/audit';
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
    const {
      projectId,
      metricsSummary,
      feedbackSummary,
      competitorUpdates,
      weekStart,
      weekEnd,
      autoAggregate = true,
      persist = true,
    } = body;

    const access = await requireProjectMembership(projectId);
    if (access.error) return access.error;

    const range = {
      start: typeof weekStart === 'string' ? weekStart : defaultWeekRange().start,
      end: typeof weekEnd === 'string' ? weekEnd : defaultWeekRange().end,
    };

    let metrics = typeof metricsSummary === 'string' ? metricsSummary : '';
    let feedback = typeof feedbackSummary === 'string' ? feedbackSummary : '';
    let competitors =
      typeof competitorUpdates === 'string' ? competitorUpdates : '';

    let counts = { feedbackCount: 0, competitorCount: 0 };

    if (autoAggregate) {
      const aggregated = await aggregateWeekSummaries(
        access.supabase,
        access.projectId,
        range
      );
      counts = {
        feedbackCount: aggregated.feedbackCount,
        competitorCount: aggregated.competitorCount,
      };
      if (!metrics.trim()) metrics = aggregated.metricsSummary;
      if (!feedback.trim()) feedback = aggregated.feedbackSummary;
      if (!competitors.trim()) competitors = aggregated.competitorUpdates;
    }

    if (!metrics.trim() && !feedback.trim() && !competitors.trim()) {
      return NextResponse.json(
        { error: '暂无可用数据，请先录入反馈或指标' },
        { status: 400 }
      );
    }

    // Charge only after we know generation can proceed
    const quota = await consumeAiQuota(access.supabase, {
      projectId: access.projectId,
      user: access.user,
      feature: 'weekly-report',
      units: 3,
    });
    if (!quota.ok) return quota.error;

    const report = await generateWeeklyReport(
      metrics || '暂无数据',
      feedback || '暂无反馈',
      competitors || '暂无动态'
    );

    let savedId: string | null = null;
    if (persist) {
      const { data: saved, error: saveError } = await access.supabase
        .from('reports')
        .insert({
          project_id: access.projectId,
          week_start: range.start,
          week_end: range.end,
          content: report,
          metrics_summary: {
            metrics,
            feedback,
            competitors,
            feedbackCount: counts.feedbackCount,
            competitorCount: counts.competitorCount,
          },
          ai_insights: [],
        })
        .select('id')
        .single();

      if (saveError) {
        console.warn('save report failed:', saveError.message);
      } else {
        savedId = saved?.id ?? null;
        await writeAuditLog(access.supabase, {
          projectId: access.projectId,
          actorId: access.user.id,
          action: 'report.create',
          entityType: 'report',
          entityId: savedId || undefined,
          meta: {
            weekStart: range.start,
            weekEnd: range.end,
            feedbackCount: counts.feedbackCount,
          },
        });
      }
    }

    return NextResponse.json({
      report,
      reportId: savedId,
      weekStart: range.start,
      weekEnd: range.end,
      counts,
      quota: quota.status,
    });
  } catch (error) {
    console.error('weekly report error:', error);
    return NextResponse.json({ error: '周报生成失败' }, { status: 500 });
  }
}
