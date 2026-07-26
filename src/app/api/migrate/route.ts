import { NextResponse } from 'next/server';

/**
 * HTTP migrate endpoint is permanently disabled.
 * Apply schema via supabase/migrations/*.sql in the Supabase SQL Editor.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: 'Gone',
      message:
        'HTTP 迁移接口已禁用。请在 Supabase Dashboard → SQL Editor 执行 supabase/migrations/ 下的脚本。',
    },
    { status: 410 }
  );
}

export async function POST() {
  return GET();
}
