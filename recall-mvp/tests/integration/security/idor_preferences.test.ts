
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { PATCH } from '@/app/api/users/[id]/preferences/route';
import { NextRequest } from 'next/server';
import { userProfileUpdater } from '@/lib/infrastructure/di/container';

// Mock the container
vi.mock('@/lib/infrastructure/di/container', () => ({
  userProfileUpdater: {
    updateSeniorProfile: vi.fn(),
  },
}));

describe('Security: Preferences IDOR', () => {
  const MOCK_USER_ID = 'user-123';
  const ATTACKER_ID = 'attacker-456';
  const TARGET_USER_ID = 'victim-789';

  it('should return 403 when x-user-id does not match the target id', async () => {
    // 1. Setup the request from an attacker trying to update a victim's profile
    const body = {
      updates: {
        topicsLove: ['Hacking'],
      },
    };

    const req = new NextRequest(`http://localhost/api/users/${TARGET_USER_ID}/preferences`, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: {
        'x-user-id': ATTACKER_ID, // Attacker's ID
        'content-type': 'application/json',
      },
    });

    const params = Promise.resolve({ id: TARGET_USER_ID });

    // 2. Call the endpoint
    const response = await PATCH(req, { params });

    // 3. Assertions
    // Currently, without the fix, this will likely succeed (status 200) or fail with 500 if the mock throws,
    // but definitely NOT 403.
    // We WANT it to be 403.

    if (response.status === 200) {
      console.log('VULNERABILITY CONFIRMED: Allowed update for mismatched user ID');
    } else {
      console.log(`Response status: ${response.status}`);
    }

    expect(response.status).toBe(403);
    expect(userProfileUpdater.updateSeniorProfile).not.toHaveBeenCalled();
  });

  it('should allow update when x-user-id matches the target id', async () => {
    // 1. Setup a legitimate request
    const body = {
      updates: {
        topicsLove: ['Gardening'],
      },
    };

    const req = new NextRequest(`http://localhost/api/users/${MOCK_USER_ID}/preferences`, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: {
        'x-user-id': MOCK_USER_ID, // Legitimate User
        'content-type': 'application/json',
      },
    });

    // Mock successful update
    (userProfileUpdater.updateSeniorProfile as any).mockResolvedValue({
      id: MOCK_USER_ID,
      preferences: { topicsLove: ['Gardening'] }
    });

    const params = Promise.resolve({ id: MOCK_USER_ID });

    // 2. Call the endpoint
    const response = await PATCH(req, { params });

    // 3. Assertions
    expect(response.status).toBe(200);
    expect(userProfileUpdater.updateSeniorProfile).toHaveBeenCalledWith(MOCK_USER_ID, { topicsLove: ['Gardening'] });
  });
});
