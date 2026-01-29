import { GET, PATCH } from '@/app/api/users/[id]/preferences/route';
import { NextRequest } from 'next/server';
import { expect, test, vi, describe } from 'vitest';

// Mock the dependencies
vi.mock('@/lib/infrastructure/di/container', () => ({
  userProfileUpdater: {
    getProfile: vi.fn().mockResolvedValue({ preferences: {} }),
    updateSeniorProfile: vi.fn().mockResolvedValue({}),
  },
}));

describe('User Preferences IDOR Security', () => {

  test('GET should return 403 when x-user-id header does not match route param', async () => {
    const req = new NextRequest('http://localhost/api/users/victim-id/preferences', {
      headers: {
        'x-user-id': 'attacker-id',
      },
    });

    // Mock params
    const params = Promise.resolve({ id: 'victim-id' });

    const res = await GET(req, { params });

    expect(res.status).toBe(403);
  });

  test('PATCH should return 403 when x-user-id header does not match route param', async () => {
    const req = new NextRequest('http://localhost/api/users/victim-id/preferences', {
      method: 'PATCH',
      headers: {
        'x-user-id': 'attacker-id',
      },
      body: JSON.stringify({ updates: { voiceTone: 'fast' } }),
    });

    // Mock params
    const params = Promise.resolve({ id: 'victim-id' });

    const res = await PATCH(req, { params });

    expect(res.status).toBe(403);
  });

  test('GET should return 200 when x-user-id header matches route param', async () => {
      const req = new NextRequest('http://localhost/api/users/user-123/preferences', {
      headers: {
        'x-user-id': 'user-123',
      },
    });

    const params = Promise.resolve({ id: 'user-123' });
    const res = await GET(req, { params });

    expect(res.status).toBe(200);
  });

  test('PATCH should return 200 when x-user-id header matches route param', async () => {
    const req = new NextRequest('http://localhost/api/users/user-123/preferences', {
      method: 'PATCH',
      headers: {
        'x-user-id': 'user-123',
      },
      body: JSON.stringify({ updates: { voiceTone: 'slow' } }),
    });

    const params = Promise.resolve({ id: 'user-123' });
    const res = await PATCH(req, { params });

    expect(res.status).toBe(200);
  });
});
