import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH } from '@/app/api/users/[id]/preferences/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/infrastructure/di/container', () => ({
  userProfileUpdater: {
    getProfile: vi.fn(),
    updateSeniorProfile: vi.fn(),
  },
}));

import { userProfileUpdater } from '@/lib/infrastructure/di/container';

describe('/api/users/[id]/preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (method: string, url: string, body: any = null, headers: Record<string, string> = {}) => {
    return new NextRequest(url, {
      method,
      body: body ? JSON.stringify(body) : null,
      headers: new Headers(headers),
    });
  };

  describe('PATCH', () => {
    it('should allow user to update their own preferences', async () => {
      const id = 'user-1';
      const req = createRequest('PATCH', `http://localhost/api/users/${id}/preferences`,
        { topicsAvoid: ['spiders'] },
        { 'x-user-id': id, 'x-user-role': 'senior' }
      );

      const params = Promise.resolve({ id });
      (userProfileUpdater.updateSeniorProfile as any).mockResolvedValue({ id, preferences: { topicsAvoid: ['spiders'] } });

      const res = await PATCH(req, { params });
      expect(res.status).toBe(200);
      expect(userProfileUpdater.updateSeniorProfile).toHaveBeenCalledWith(id, { topicsAvoid: ['spiders'] });
    });

    it('should block user updating another user (IDOR)', async () => {
      const targetId = 'user-1';
      const attackerId = 'user-2';
      const req = createRequest('PATCH', `http://localhost/api/users/${targetId}/preferences`,
        { topicsAvoid: ['hack'] },
        { 'x-user-id': attackerId, 'x-user-role': 'senior' }
      );

      const params = Promise.resolve({ id: targetId });

      const res = await PATCH(req, { params });
      expect(res.status).toBe(403);
      expect(userProfileUpdater.updateSeniorProfile).not.toHaveBeenCalled();
    });

    it('should allow family member linked to senior', async () => {
      const seniorId = 'senior-1';
      const familyId = 'family-1';
      const req = createRequest('PATCH', `http://localhost/api/users/${seniorId}/preferences`,
        { topicsAvoid: ['sugar'] },
        { 'x-user-id': familyId, 'x-user-role': 'family' }
      );

      const params = Promise.resolve({ id: seniorId });

      // Mock family profile lookup
      (userProfileUpdater.getProfile as any).mockResolvedValue({ id: familyId, role: 'family', seniorId: seniorId });
      (userProfileUpdater.updateSeniorProfile as any).mockResolvedValue({ id: seniorId });

      const res = await PATCH(req, { params });
      expect(res.status).toBe(200);
      expect(userProfileUpdater.updateSeniorProfile).toHaveBeenCalledWith(seniorId, { topicsAvoid: ['sugar'] });
    });

    it('should block family member NOT linked to senior', async () => {
      const seniorId = 'senior-1';
      const familyId = 'family-other';
      const req = createRequest('PATCH', `http://localhost/api/users/${seniorId}/preferences`,
        { topicsAvoid: ['sugar'] },
        { 'x-user-id': familyId, 'x-user-role': 'family' }
      );

      const params = Promise.resolve({ id: seniorId });

      // Mock family profile lookup - linked to DIFFERENT senior
      (userProfileUpdater.getProfile as any).mockResolvedValue({ id: familyId, role: 'family', seniorId: 'senior-2' });

      const res = await PATCH(req, { params });
      expect(res.status).toBe(403);
      expect(userProfileUpdater.updateSeniorProfile).not.toHaveBeenCalled();
    });
  });

  describe('GET', () => {
     it('should allow user to read their own preferences', async () => {
      const id = 'user-1';
      const req = createRequest('GET', `http://localhost/api/users/${id}/preferences`,
        null,
        { 'x-user-id': id, 'x-user-role': 'senior' }
      );

      const params = Promise.resolve({ id });
      (userProfileUpdater.getProfile as any).mockResolvedValue({ id, preferences: { topicsAvoid: ['spiders'] } });

      const res = await GET(req, { params });
      expect(res.status).toBe(200);
    });

    it('should block user reading another user (IDOR)', async () => {
      const targetId = 'user-1';
      const attackerId = 'user-2';
      const req = createRequest('GET', `http://localhost/api/users/${targetId}/preferences`,
        null,
        { 'x-user-id': attackerId, 'x-user-role': 'senior' }
      );

      const params = Promise.resolve({ id: targetId });

      const res = await GET(req, { params });
      expect(res.status).toBe(403);
    });
  });
});
