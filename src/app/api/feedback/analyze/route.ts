import { NextRequest, NextResponse } from 'next/server';
import { requireProjectMembership } from '@/lib/tenancy';
import { analyzeFeedback } from '@/lib/ai';
import { consumeAiQuota } from '@/lib/quota';

export async function POST(request: NextRequest) {
  if (!process.env.ZHIPUAI_API_KEY) {
    return NextResponse.json({ error: 'AI 服务未配置' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { content, projectId, feedbackId } = body;

    const access = await requireProjectMembership(projectId);
    if (access.error) return access.error;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: '请输入反馈内容' }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: '反馈内容过长，请控制在2000字以内' },
        { status: 400 }
      );
    }

    const quota = await consumeAiQuota(access.supabase, {
      projectId: access.projectId,
      user: access.user,
      feature: 'feedback-analyze',
      units: 1,
    });
    if (!quota.ok) return quota.error;

    const analysis = await analyzeFeedback(content);

    let persisted = false;
    if (feedbackId && typeof feedbackId === 'string') {
      const { error: updateError } = await access.supabase
        .from('feedback_items')
        .update({
          category: analysis.category,
          sentiment: analysis.sentiment,
          priority: analysis.priority,
        })
        .eq('id', feedbackId)
        .eq('project_id', access.projectId);

      if (updateError) {
        console.error('服务端写回分析结果失败:', updateError.message);
      } else {
        persisted = true;
      }
    }

    return NextResponse.json({
      result: analysis,
      quota: quota.status,
      persisted,
    });
  } catch (error) {
    console.error('反馈分析错误:', error);
    return NextResponse.json(
      { error: '分析失败，请稍后重试' },
      { status: 500 }
    );
  }
}
