import { test, expect } from '@playwright/test';
import { SignJWT } from 'jose';

// Default secret must match the one used by the server in test environment
// In CI/Production, this should be set via environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'this-is-a-very-long-secret-key-at-least-32-chars';

async function generateToken(userId: string) {
  const key = new TextEncoder().encode(JWT_SECRET);
  return await new SignJWT({ userId, role: 'user' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key);
}

test.describe('Security Middleware', () => {
  test('should return 401 for unauthenticated access to protected API routes', async ({ request }) => {
    // Attempt to access a protected route without a session cookie
    const response = await request.get('/api/users/1/export');

    // Expect 401 Unauthorized
    if (response.status() !== 401) {
      console.log('Status:', response.status());
      console.log('Body:', await response.text());
    }
    expect(response.status(), 'Endpoint should return 401 when unauthenticated').toBe(401);
  });

  test('should return 403 for IDOR attempt on export', async ({ request }) => {
    // Generate a valid token for 'user-a' signed with the shared secret
    const token = await generateToken('user-a');

    // User A tries to access User B's export
    const response = await request.get('/api/users/user-b/export', {
      headers: {
        'Cookie': `session=${token}`
      }
    });

    if (response.status() !== 403) {
        console.log('IDOR Status:', response.status());
    }
    expect(response.status(), 'Endpoint should return 403 when accessing another users data').toBe(403);
  });

  test('should return 401 for random api route', async ({ request }) => {
      const response = await request.get('/api/some-random-protected-route');
      expect(response.status()).toBe(401);
  });
});
