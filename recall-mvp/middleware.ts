import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/jwt';

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/health',
  '/api/cron', // Cron jobs usually have their own auth (header-based)
  '/_next',
  '/favicon.ico',
  '/images',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Check if the route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // 2. Prepare the response (we might modify request headers)
  // We use NextResponse.next() to pass control to the next handler
  const requestHeaders = new Headers(req.headers);

  // SECURITY: Always strip incoming sensitive headers to prevent spoofing
  // An attacker might try to send these headers directly
  requestHeaders.delete('x-user-id');
  requestHeaders.delete('x-user-role');

  // 3. Verify Session
  const cookie = req.cookies.get('session');
  let session = null;

  if (cookie?.value) {
    session = await verifySession(cookie.value);
  }

  // 4. Handle Authentication
  if (session) {
    // Valid session: Inject trusted headers
    requestHeaders.set('x-user-id', session.userId);
    requestHeaders.set('x-user-role', session.role);
  } else {
    // No valid session
    if (!isPublicRoute) {
      // If it's an API route, return 401
      if (pathname.startsWith('/api')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // If it's a page, redirect to login
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
  }

  // 5. Allow request to proceed with (potentially modified) headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/cron (handled separately usually)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
