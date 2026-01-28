import { GET, PATCH } from '@/app/api/users/[id]/preferences/route';
import { NextRequest } from 'next/server';
import { expect, test, vi, describe, beforeEach, afterEach } from 'vitest';

// Mock the dependencies
vi.mock('@/lib/infrastructure/di/container', () => ({
  userProfileUpdater: {
    updateSeniorProfile: vi.fn().mockResolvedValue({ id: 'victim-id', preferences: {} }),
    getProfile: vi.fn().mockResolvedValue({ id: 'victim-id', preferences: {} }),
  },
}));

describe('User Preferences IDOR Security', () => {

  beforeEach(() => {
    vi.resetModules();
  });

  test('PATCH should return 403 when x-user-id does not match route param id', async () => {
    const victimId = 'victim-id';
    const attackerId = 'attacker-id';

    // Simulate request from attacker trying to update victim's profile
    const req = new NextRequest(`http://localhost/api/users/${victimId}/preferences`, {
      method: 'PATCH',
      headers: {
        'x-user-id': attackerId,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ updates: { voiceTone: 'pirate' } }),
    });

    const params = Promise.resolve({ id: victimId });
    const res = await PATCH(req, { params });

    // Expect Forbidden
    expect(res.status).toBe(403);
  });

  test('GET should return 403 when x-user-id does not match route param id', async () => {
    const victimId = 'victim-id';
    const attackerId = 'attacker-id';

    // Simulate request from attacker trying to read victim's profile
    const req = new NextRequest(`http://localhost/api/users/${victimId}/preferences`, {
      method: 'GET',
      headers: {
        'x-user-id': attackerId,
      },
    });

    const params = Promise.resolve({ id: victimId });
    const res = await GET(req, { params });

    // Expect Forbidden
    expect(res.status).toBe(403);
  });

  test('PATCH should return 200 when x-user-id matches route param id', async () => {
    const userId = 'user-123';

    const req = new NextRequest(`http://localhost/api/users/${userId}/preferences`, {
      method: 'PATCH',
      headers: {
        'x-user-id': userId,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ updates: { voiceTone: 'friendly' } }),
    });

    const params = Promise.resolve({ id: userId });
    const res = await PATCH(req, { params });

    expect(res.status).toBe(200);
  });

  test('GET should return 200 when x-user-id matches route param id', async () => {
    const userId = 'user-123';

    const req = new NextRequest(`http://localhost/api/users/${userId}/preferences`, {
      method: 'GET',
      headers: {
        'x-user-id': userId,
      },
    });

    const params = Promise.resolve({ id: userId });
    const res = await GET(req, { params });

    expect(res.status).toBe(200);
  });
});
