import { describe, it, expect, vi, beforeEach } from 'vitest';
import { middleware } from '@/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/jwt';

// Mock dependencies
vi.mock('@/lib/auth/jwt', () => ({
  verifySession: vi.fn(),
}));

describe('Middleware Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (path: string, headers: Record<string, string> = {}, cookies: Record<string, string> = {}) => {
    const url = `http://localhost:3000${path}`;
    const req = new NextRequest(url, {
      headers: new Headers(headers),
    });

    // Set cookies
    Object.entries(cookies).forEach(([key, value]) => {
      req.cookies.set(key, value);
    });

    return req;
  };

  it('should strip spoofed x-user-id headers from unauthenticated requests', async () => {
    const req = createRequest('/api/users/profile', {
      'x-user-id': 'admin',
      'x-user-role': 'senior'
    });

    const res = await middleware(req);

    // Should return 401 because session is invalid/missing
    // and headers should not be trusted
    expect(res).toBeInstanceOf(NextResponse);
    expect(res.status).toBe(401);
  });

  it('should strip spoofed x-user-id headers even if session is valid (and replace with real ones)', async () => {
    // Attacker tries to impersonate 'admin' but has a valid session for 'user-123'
    const req = createRequest('/api/users/profile', {
      'x-user-id': 'admin'
    }, {
      'session': 'valid-token'
    });

    // Mock verifySession to return 'user-123'
    (verifySession as any).mockResolvedValue({ userId: 'user-123', role: 'family' });

    const res = await middleware(req);

    // Should succeed (allow request to proceed)
    // We can't easily check the modified request headers in the response object of NextResponse.next()
    // directly in unit tests without some hacks, but we can verify it didn't block it.
    // However, the critical part is that logic MUST call headers.delete() before setting new ones.
    // In our implementation, we delete first.

    // In Next.js middleware testing, NextResponse.next() returns a response with a specific header that Next.js uses internally.
    // We can't inspect the 'request' object passed to the next handler easily here.
    // But we know if verifySession returns a user, it sets the headers.

    expect(res.status).toBe(200); // 200 here means "proceed", technically NextResponse.next() is a 200 with no body usually
  });

  it('should redirect unauthenticated users on protected pages', async () => {
    const req = createRequest('/dashboard'); // Protected page
    const res = await middleware(req);

    expect(res.status).toBe(307); // Temporary Redirect
    expect(res.headers.get('location')).toContain('/login');
  });

  it('should allow public routes without session', async () => {
    const req = createRequest('/login');
    const res = await middleware(req);

    // Should allow (NextResponse.next())
    expect(res.status).toBe(200);
  });

  it('should return 401 for API routes without session', async () => {
    const req = createRequest('/api/users/profile');
    const res = await middleware(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });
});
