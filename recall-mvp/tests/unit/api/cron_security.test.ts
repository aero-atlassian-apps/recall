import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '@/app/api/cron/process-jobs/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/infrastructure/di/container', () => ({
  generateChapterUseCase: {
    execute: vi.fn(),
  },
  jobRepository: {
    findPending: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

vi.mock('@/lib/core/application/Logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

import { jobRepository } from '@/lib/infrastructure/di/container';

describe('GET /api/cron/process-jobs', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.CRON_SECRET = 'super_secret_key_123';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const createRequest = (authHeader?: string) => {
    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['authorization'] = authHeader;
    }
    return new NextRequest('http://localhost:3000/api/cron/process-jobs', {
      headers: new Headers(headers),
    });
  };

  it('should return 401 if CRON_SECRET is not set', async () => {
    delete process.env.CRON_SECRET;
    const req = createRequest('Bearer super_secret_key_123');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('should return 401 if authorization header is missing', async () => {
    const req = createRequest();
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('should return 401 if authorization header is incorrect', async () => {
    const req = createRequest('Bearer wrong_key');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('should return 200 and process jobs if authorized', async () => {
    (jobRepository.findPending as any).mockResolvedValue([]);
    const req = createRequest('Bearer super_secret_key_123');
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('should not leak internal error details on failure', async () => {
    // Setup - force an error
    (jobRepository.findPending as any).mockRejectedValue(new Error('Database Connection Failed - sensitive info inside'));

    const req = createRequest('Bearer super_secret_key_123');
    const res = await GET(req);

    const body = await res.json();

    expect(res.status).toBe(500);
    // Expect generic error message
    expect(body.error).toBe('Internal Server Error');
  });
});
