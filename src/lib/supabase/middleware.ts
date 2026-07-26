import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { safeNextPath } from '@/lib/safe-url';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const pathname = request.nextUrl.pathname;
  const isHealthApi = pathname.startsWith('/api/health');

  // Local: allow UI without Supabase. Production: fail closed (health still reachable).
  if (!url || !key) {
    if (process.env.NODE_ENV === 'production') {
      if (isHealthApi) {
        return supabaseResponse;
      }
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: '认证服务未配置' },
          { status: 503 }
        );
      }
      return new NextResponse('服务未配置：缺少 Supabase 环境变量', {
        status: 503,
      });
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage =
    pathname.startsWith('/login') || pathname.startsWith('/signup');
  const isAuthCallback = pathname.startsWith('/auth/callback');
  const isInvitePage = pathname.startsWith('/invite/');
  const isPricingPage = pathname === '/pricing' || pathname.startsWith('/pricing/');
  const isPublicApi =
    isHealthApi ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico';

  if (
    !user &&
    !isAuthPage &&
    !isAuthCallback &&
    !isInvitePage &&
    !isPricingPage &&
    !isPublicApi
  ) {
    if (pathname.startsWith('/api/')) {
      const unauthorized = NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        unauthorized.cookies.set(cookie.name, cookie.value);
      });
      return unauthorized;
    }

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.search = '';
    redirectUrl.searchParams.set('next', pathname);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  if (user && isAuthPage) {
    const next = safeNextPath(request.nextUrl.searchParams.get('next'));
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = next;
    redirectUrl.search = '';
    // If next is still an auth page, go home.
    if (next.startsWith('/login') || next.startsWith('/signup')) {
      redirectUrl.pathname = '/';
    }
    const redirectResponse = NextResponse.redirect(redirectUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  return supabaseResponse;
}
