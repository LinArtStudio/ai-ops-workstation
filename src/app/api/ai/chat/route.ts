// AI对话API - 流式响应
import { NextRequest } from 'next/server';
import { chatCompletionStream } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: '消息格式错误' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 调用智谱AI流式API
    const stream = await chatCompletionStream(messages);

    // 返回流式响应
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('AI对话错误:', error);
    return new Response(
      JSON.stringify({ error: 'AI服务暂时不可用' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
