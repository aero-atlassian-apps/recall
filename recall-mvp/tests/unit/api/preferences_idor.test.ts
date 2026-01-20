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

describe('API /api/users/[id]/preferences Security', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (method: string, body: any = null, headers: Record<string, string> = {}) => {
    return new NextRequest('http://localhost:3000/api/users/123/preferences', {
      method,
      body: body ? JSON.stringify(body) : null,
      headers: new Headers(headers),
    });
  };

  it('PATCH should reject IDOR attack (user ID mismatch)', async () => {
    const req = createRequest('PATCH', { updates: { voiceTone: 'fast' } }, {
      'x-user-id': '456', // Attacker ID
      'x-user-role': 'senior'
    });

    // We are trying to update user '123' (from URL) while logged in as '456'
    const params = Promise.resolve({ id: '123' });

    const res = await PATCH(req, { params });

    // In vulnerable code, this is 200. We expect 403 after fix.
    expect(res.status).toBe(403);
    expect(userProfileUpdater.updateSeniorProfile).not.toHaveBeenCalled();
  });

  it('GET should reject IDOR attack (user ID mismatch)', async () => {
    const req = createRequest('GET', null, {
      'x-user-id': '456', // Attacker ID
      'x-user-role': 'senior'
    });

    const params = Promise.resolve({ id: '123' });

    const res = await GET(req, { params });

    // In vulnerable code, this is 200. We expect 403 after fix.
    expect(res.status).toBe(403);
    expect(userProfileUpdater.getProfile).not.toHaveBeenCalled();
  });

  it('PATCH should allow owner access', async () => {
    const req = createRequest('PATCH', { updates: { voiceTone: 'fast' } }, {
      'x-user-id': '123', // Owner ID
      'x-user-role': 'senior'
    });

    const params = Promise.resolve({ id: '123' });
    (userProfileUpdater.updateSeniorProfile as any).mockResolvedValue({ id: '123' });

    const res = await PATCH(req, { params });

    expect(res.status).toBe(200);
    expect(userProfileUpdater.updateSeniorProfile).toHaveBeenCalled();
  });
});
