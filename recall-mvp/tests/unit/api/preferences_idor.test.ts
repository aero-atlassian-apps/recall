import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH } from '@/app/api/users/[id]/preferences/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/infrastructure/di/container', () => ({
  userProfileUpdater: {
    updateSeniorProfile: vi.fn(),
    getProfile: vi.fn(),
  },
}));

import { userProfileUpdater } from '@/lib/infrastructure/di/container';

describe('PATCH /api/users/[id]/preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: any, headers: Record<string, string> = {}) => {
    return new NextRequest('http://localhost:3000/api/users/victim-id/preferences', {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: new Headers(headers),
    });
  };

  it('should demonstrate IDOR vulnerability', async () => {
    const victimId = 'victim-id';
    const attackerId = 'attacker-id';
    const updates = { topicsLove: ['Hacking'] };

    const req = createRequest(
      { updates },
      { 'x-user-id': attackerId, 'x-user-role': 'senior' }
    );

    // Mock successful update
    (userProfileUpdater.updateSeniorProfile as any).mockResolvedValue({ id: victimId, ...updates });

    const params = Promise.resolve({ id: victimId });
    const res = await PATCH(req, { params });

    // SECURE BEHAVIOR:
    expect(res.status).toBe(403);
    expect(userProfileUpdater.updateSeniorProfile).not.toHaveBeenCalled();
  });
});
