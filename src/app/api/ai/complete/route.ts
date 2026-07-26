import { NextRequest, NextResponse } from 'next/server';
import { requireProjectMembership } from '@/lib/tenancy';
import { chatCompletion } from '@/lib/ai';
import { consumeAiQuota } from '@/lib/quota';

export async function POST(request: NextRequest) {
  if (!process.env.ZHIPUAI_API_KEY) {
    return NextResponse.json({ error: 'AI 服务未配置' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { messages, temperature, maxTokens, projectId } = body;

    const access = await requireProjectMembership(projectId);
    if (access.error) return access.error;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: '消息格式错误' }, { status: 400 });
    }

    if (messages.length > 40) {
      return NextResponse.json({ error: '消息过多' }, { status: 400 });
    }

    const totalChars = messages.reduce((sum: number, m: { content?: unknown }) => {
      return sum + (typeof m?.content === 'string' ? m.content.length : 0);
    }, 0);
    if (totalChars > 24000) {
      return NextResponse.json({ error: '消息内容过长' }, { status: 400 });
    }

    const quota = await consumeAiQuota(access.supabase, {
      projectId: access.projectId,
      user: access.user,
      feature: 'complete',
      units: 1,
    });
    if (!quota.ok) return quota.error;

    const safeMaxTokens =
      typeof maxTokens === 'number'
        ? Math.min(Math.max(1, Math.floor(maxTokens)), 4096)
        : 2048;

    const content = await chatCompletion(messages, {
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      maxTokens: safeMaxTokens,
    });

    return NextResponse.json({ content, quota: quota.status });
  } catch (error) {
    console.error('AI complete error:', error);
    return NextResponse.json({ error: 'AI 服务暂时不可用' }, { status: 500 });
  }
}
