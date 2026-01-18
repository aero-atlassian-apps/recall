import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { generateChapterUseCase, jobRepository } from '@/lib/infrastructure/di/container';
import { logger } from '@/lib/core/application/Logger';

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  // Security: Ensure CRON_SECRET is set
  if (!cronSecret) {
    logger.error('Security Alert: CRON_SECRET is missing in environment');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Security: Prevent Timing Attacks
  // Use constant-time comparison instead of direct string comparison
  const expectedAuth = `Bearer ${cronSecret}`;
  const actualAuth = authHeader || ''; // Safe fallback for hashing

  // Hash both values to ensure equal length buffers for timingSafeEqual
  const expectedHash = crypto.createHash('sha256').update(expectedAuth).digest();
  const actualHash = crypto.createHash('sha256').update(actualAuth).digest();

  if (!crypto.timingSafeEqual(expectedHash, actualHash)) {
    logger.warn('Unauthorized cron access attempt', { ip: request.ip });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch pending jobs
    const jobs = await jobRepository.findPending('generate_chapter', 5); // Process batch of 5

    const results = [];

    for (const job of jobs) {
      try {
        // Mark as processing
        await jobRepository.updateStatus(job.id, 'processing');

        const { sessionId } = job.payload;
        if (!sessionId) throw new Error("Missing sessionId in payload");

        // Execute core logic
        const chapterId = await generateChapterUseCase.execute(sessionId);

        // Mark as completed
        await jobRepository.updateStatus(job.id, 'completed', { chapterId });
        results.push({ jobId: job.id, status: 'completed', chapterId });

      } catch (error: any) {
        logger.error(`Job ${job.id} failed`, { error: error.message });
        await jobRepository.updateStatus(job.id, 'failed', undefined, error.message);
        results.push({ jobId: job.id, status: 'failed', error: error.message });
      }
    }

    return NextResponse.json({ processed: results.length, results });
  } catch (error: any) {
    // Security: Don't leak stack traces or internal error details to client
    logger.error('Cron job process failed', { error: error.message, stack: error.stack });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
