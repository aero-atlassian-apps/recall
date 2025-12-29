import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { generateChapterUseCase, jobRepository } from '@/lib/infrastructure/di/container';

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  // Security: Ensure CRON_SECRET is set
  if (!cronSecret) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  // Security: Prevent timing attacks
  const expectedAuth = `Bearer ${cronSecret}`;
  const providedAuth = authHeader || '';

  // Use timingSafeEqual to compare secrets
  // We buffer both strings to same length if possible, or fallback
  const expectedBuffer = Buffer.from(expectedAuth);
  const providedBuffer = Buffer.from(providedAuth);

  let isValid = false;
  if (expectedBuffer.length === providedBuffer.length) {
    isValid = timingSafeEqual(expectedBuffer, providedBuffer);
  }

  if (!isValid) {
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
        console.error(`Job ${job.id} failed:`, error);
        await jobRepository.updateStatus(job.id, 'failed', undefined, error.message);
        results.push({ jobId: job.id, status: 'failed', error: error.message });
      }
    }

    return NextResponse.json({ processed: results.length, results });
  } catch (error: any) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
