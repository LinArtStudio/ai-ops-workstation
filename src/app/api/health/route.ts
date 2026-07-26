import { NextResponse } from 'next/server';

export async function GET() {
  const hasAi = !!process.env.ZHIPUAI_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const hasDbEnv = !!(supabaseUrl && supabaseKey);

  let databaseReachable: boolean | null = null;
  if (hasDbEnv) {
    try {
      const probe = await fetch(`${supabaseUrl}/auth/v1/health`, {
        headers: { apikey: supabaseKey },
        signal: AbortSignal.timeout(4000),
      });
      databaseReachable = probe.ok || probe.status < 500;
    } catch {
      databaseReachable = false;
    }
  }

  const ok = hasAi && hasDbEnv && databaseReachable !== false;
  const body = {
    status: ok ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    services: {
      ai: hasAi,
      databaseEnv: hasDbEnv,
      databaseReachable,
    },
  };

  return NextResponse.json(body, { status: ok ? 200 : 503 });
}
