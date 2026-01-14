import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '../../middleware';
import * as jwt from '../../lib/auth/jwt';

// Mock dependencies
vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server');
  return {
    ...actual,
    NextResponse: {
      next: vi.fn().mockImplementation((options) => ({
        headers: options?.request?.headers || new Headers(),
        status: 200,
      })),
      redirect: vi.fn().mockImplementation((url) => ({
        headers: new Headers({ Location: url.toString() }),
        status: 307,
      })),
      json: vi.fn().mockImplementation((body, options) => ({
        body: JSON.stringify(body),
        status: options?.status || 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
      })),
    },
  };
});

vi.mock('../../lib/auth/jwt', () => ({
  verifySession: vi.fn(),
}));

describe('Middleware Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createRequest(path: string, headers: Record<string, string> = {}, cookies: Record<string, string> = {}) {
    const url = new URL(`http://localhost${path}`);
    const req = new NextRequest(url, { headers: new Headers(headers) });

    // Mock cookies
    Object.defineProperty(req, 'cookies', {
      value: {
        get: (name: string) => cookies[name] ? { value: cookies[name] } : undefined,
        getAll: () => Object.entries(cookies).map(([name, value]) => ({ name, value })),
      },
    });

    return req;
  }

  it('allows access to public routes without session', async () => {
    const req = createRequest('/login');
    await middleware(req);
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it('redirects to login for protected page without session', async () => {
    const req = createRequest('/dashboard');
    const res = await middleware(req);

    expect(NextResponse.redirect).toHaveBeenCalled();
    const redirectUrl = (NextResponse.redirect as any).mock.calls[0][0];
    expect(redirectUrl.pathname).toBe('/login');
  });

  it('returns 401 for protected API route without session', async () => {
    const req = createRequest('/api/protected');
    const res = await middleware(req);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  });

  it('allows access to protected route with valid session and injects headers', async () => {
    const req = createRequest('/dashboard', {}, { session: 'valid-token' });
    vi.mocked(jwt.verifySession).mockResolvedValue({ userId: 'user-123', role: 'senior' });

    await middleware(req);

    expect(jwt.verifySession).toHaveBeenCalledWith('valid-token');
    expect(NextResponse.next).toHaveBeenCalled();

    // Check if headers were modified in the request passed to next()
    const callArgs = (NextResponse.next as any).mock.calls[0][0];
    expect(callArgs.request.headers.get('x-user-id')).toBe('user-123');
    expect(callArgs.request.headers.get('x-user-role')).toBe('senior');
  });

  it('strips spoofed headers from request', async () => {
    const req = createRequest('/dashboard', { 'x-user-id': 'admin', 'x-user-role': 'admin' }, { session: 'valid-token' });
    vi.mocked(jwt.verifySession).mockResolvedValue({ userId: 'user-123', role: 'senior' });

    await middleware(req);

    const callArgs = (NextResponse.next as any).mock.calls[0][0];
    // Should contain the trusted values, not the spoofed ones
    expect(callArgs.request.headers.get('x-user-id')).toBe('user-123');
    expect(callArgs.request.headers.get('x-user-role')).toBe('senior');
  });

  it('redirects if session is invalid', async () => {
     const req = createRequest('/dashboard', {}, { session: 'invalid-token' });
     vi.mocked(jwt.verifySession).mockResolvedValue(null);

     await middleware(req);

     expect(NextResponse.redirect).toHaveBeenCalled();
  });

  it('blocks GET /api/users without session (only POST is public)', async () => {
    // Override createRequest to support method if needed, or just hack it since we mocked NextRequest?
    // My createRequest helper doesn't support method. I need to update it or manually create req.
    const url = new URL('http://localhost/api/users');
    const req = new NextRequest(url, { method: 'GET' });

    // Mock cookies on this specific request instance
    Object.defineProperty(req, 'cookies', {
        value: {
          get: () => undefined,
          getAll: () => [],
        },
      });

    const res = await middleware(req);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  });

  it('allows POST /api/users without session', async () => {
    const url = new URL('http://localhost/api/users');
    const req = new NextRequest(url, { method: 'POST' });
     // Mock cookies on this specific request instance
    Object.defineProperty(req, 'cookies', {
        value: {
          get: () => undefined,
          getAll: () => [],
        },
      });

    await middleware(req);
    expect(NextResponse.next).toHaveBeenCalled();
  });
});
