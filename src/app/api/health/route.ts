// 健康检查API
import { NextResponse } from 'next/server';

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      ai: !!process.env.ZHIPUAI_API_KEY,
      database: !!process.env.NEXT_PUBLIC_SUPABASE_URL
    }
  };

  return NextResponse.json(health);
}
