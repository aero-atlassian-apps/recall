import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH, GET } from '@/app/api/users/[id]/preferences/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/infrastructure/di/container', () => ({
  userProfileUpdater: {
    updateSeniorProfile: vi.fn(),
    getProfile: vi.fn(),
  },
}));

import { userProfileUpdater } from '@/lib/infrastructure/di/container';

describe('API IDOR Vulnerability Check: /api/users/[id]/preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (method: string, body: any = null, headers: Record<string, string> = {}) => {
    return new NextRequest('http://localhost:3000/api/users/target-user/preferences', {
      method,
      body: body ? JSON.stringify(body) : null,
      headers: new Headers(headers),
    });
  };

  it('SECURITY: should REJECT updating another user preferences (IDOR protection)', async () => {
    const targetUserId = 'target-user';
    const attackerUserId = 'attacker-user';
    const updates = { topicsLove: ['Hacking'] };

    // Request simulates Attacker trying to update Target's preferences
    const req = createRequest(
      'PATCH',
      { updates },
      { 'x-user-id': attackerUserId, 'x-user-role': 'senior' }
    );

    // Call the endpoint with target-user ID in params
    const params = Promise.resolve({ id: targetUserId });
    const res = await PATCH(req, { params });

    // EXPECTED BEHAVIOR: 403 Forbidden
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe('Forbidden');

    // Verify we did NOT call update
    expect(userProfileUpdater.updateSeniorProfile).not.toHaveBeenCalled();
  });

   it('SECURITY: should REJECT viewing another user preferences (IDOR protection)', async () => {
    const targetUserId = 'target-user';
    const attackerUserId = 'attacker-user';

    // Request simulates Attacker trying to view Target's preferences
    const req = createRequest(
      'GET',
      null,
      { 'x-user-id': attackerUserId, 'x-user-role': 'senior' }
    );

    // Call the endpoint with target-user ID in params
    const params = Promise.resolve({ id: targetUserId });
    const res = await GET(req, { params });

    // EXPECTED BEHAVIOR: 403 Forbidden
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe('Forbidden');

    expect(userProfileUpdater.getProfile).not.toHaveBeenCalled();
  });

    it('SECURITY: should ALLOW updating OWN preferences', async () => {
    const userId = 'target-user'; // Must match the URL in createRequest which is hardcoded to target-user
    const updates = { topicsLove: ['Coding'] };

    const req = createRequest(
      'PATCH',
      { updates },
      { 'x-user-id': userId, 'x-user-role': 'senior' }
    );

    (userProfileUpdater.updateSeniorProfile as any).mockResolvedValue({ id: userId, ...updates });

    const params = Promise.resolve({ id: userId });
    const res = await PATCH(req, { params });

    expect(res.status).toBe(200);
    expect(userProfileUpdater.updateSeniorProfile).toHaveBeenCalledWith(userId, expect.anything());
  });
});
