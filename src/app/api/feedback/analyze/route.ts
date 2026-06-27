// 反馈分析API - 服务端处理
import { NextRequest, NextResponse } from 'next/server';
import { analyzeFeedback } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: '请输入反馈内容' },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: '反馈内容过长，请控制在2000字以内' },
        { status: 400 }
      );
    }

    const analysis = await analyzeFeedback(content);

    return NextResponse.json({ result: analysis });
  } catch (error) {
    console.error('反馈分析错误:', error);
    return NextResponse.json(
      { error: '分析失败，请稍后重试' },
      { status: 500 }
    );
  }
}
