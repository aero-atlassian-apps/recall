import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth/jwt';

// Define public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/onboarding',
  '/api/auth/login',
  '/api/auth/reset-password',
  '/api/users', // Allow POST for registration
];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  let isPublic = PUBLIC_ROUTES.includes(path);

  // Special handling for /api/users: only POST is public
  if (path === '/api/users' && req.method !== 'POST') {
    isPublic = false;
  }

  // 1. Check for session
  const cookie = req.cookies.get('session')?.value;
  const session = cookie ? await verifySession(cookie) : null;

  // 2. Protect routes
  if (!isPublic && !session) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // 3. Security: Strip spoofed headers & Inject trusted ones
  // We do this even for public routes if a valid session exists,
  // ensuring downstream handlers always get trusted data if available.
  if (session) {
    const requestHeaders = new Headers(req.headers);

    // SECURITY: Remove any user-controlled headers to prevent spoofing
    requestHeaders.delete('x-user-id');
    requestHeaders.delete('x-user-role');

    // Inject trusted headers from verified session
    requestHeaders.set('x-user-id', session.userId);
    requestHeaders.set('x-user-role', session.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

// Configure matcher to exclude static assets
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
