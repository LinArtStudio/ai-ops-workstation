import type { SupabaseClient } from '@supabase/supabase-js';
import type { FeedbackItem, Competitor } from '@/types/database';

export interface WeekRange {
  start: string; // YYYY-MM-DD
  end: string;
}

export interface LoopSummaries {
  metricsSummary: string;
  feedbackSummary: string;
  competitorUpdates: string;
  feedbackCount: number;
  competitorCount: number;
}

export async function aggregateWeekSummaries(
  supabase: SupabaseClient,
  projectId: string,
  range: WeekRange
): Promise<LoopSummaries> {
  const startIso = `${range.start}T00:00:00.000Z`;
  const endIso = `${range.end}T23:59:59.999Z`;

  const [{ data: feedbackRows }, { data: competitorRows }, { data: metricRows }] =
    await Promise.all([
      supabase
        .from('feedback_items')
        .select('*')
        .eq('project_id', projectId)
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('competitors')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('metrics')
        .select('metric_name, metric_value, recorded_at')
        .eq('project_id', projectId)
        .gte('recorded_at', startIso)
        .lte('recorded_at', endIso)
        .order('recorded_at', { ascending: false })
        .limit(50),
    ]);

  const feedback = (feedbackRows || []) as FeedbackItem[];
  const competitors = (competitorRows || []) as Competitor[];

  return {
    metricsSummary: buildMetricsSummary(metricRows || []),
    feedbackSummary: buildFeedbackSummary(feedback),
    competitorUpdates: buildCompetitorSummary(competitors),
    feedbackCount: feedback.length,
    competitorCount: competitors.length,
  };
}

function buildMetricsSummary(
  rows: Array<{ metric_name: string; metric_value: number | string }>
): string {
  if (!rows.length) {
    return '本周暂无已录入的核心指标。';
  }

  const latest = new Map<string, number>();
  for (const row of rows) {
    if (!latest.has(row.metric_name)) {
      latest.set(row.metric_name, Number(row.metric_value));
    }
  }

  return Array.from(latest.entries())
    .map(([name, value]) => `${name}: ${value}`)
    .join('；');
}

function buildFeedbackSummary(items: FeedbackItem[]): string {
  if (!items.length) {
    return '本周暂无用户反馈。';
  }

  const byCategory: Record<string, number> = {};
  const bySentiment: Record<string, number> = {};
  for (const item of items) {
    const cat = item.category || '未分类';
    const sent = item.sentiment || '未知';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
    bySentiment[sent] = (bySentiment[sent] || 0) + 1;
  }

  const topSamples = items
    .slice(0, 8)
    .map((item, i) => `${i + 1}. [${item.category || '未分类'}/${item.sentiment || '未知'}] ${item.content.slice(0, 80)}`)
    .join('\n');

  return [
    `本周共 ${items.length} 条反馈。`,
    `分类：${Object.entries(byCategory).map(([k, v]) => `${k}${v}`).join('、')}`,
    `情感：${Object.entries(bySentiment).map(([k, v]) => `${k}${v}`).join('、')}`,
    '代表性反馈：',
    topSamples,
  ].join('\n');
}

function buildCompetitorSummary(items: Competitor[]): string {
  if (!items.length) {
    return '暂无竞品记录。';
  }

  return items
    .map((c) => {
      const notes = c.notes ? `；备注：${c.notes}` : '';
      const pricing = c.pricing ? `；定价：${c.pricing}` : '';
      return `- ${c.name}${pricing}${notes}`;
    })
    .join('\n');
}
