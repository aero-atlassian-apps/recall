import { NextRequest, NextResponse } from 'next/server';
import { DrizzleChapterRepository } from '@/lib/infrastructure/adapters/db/DrizzleChapterRepository';
import { DrizzleUserRepository } from '@/lib/infrastructure/adapters/db/DrizzleUserRepository';

const chapterRepository = new DrizzleChapterRepository();
const userRepository = new DrizzleUserRepository();

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // SECURITY: Use trusted user ID from middleware header to prevent IDOR
    const userId = req.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chapter = await chapterRepository.findById(id);
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    const requester = await userRepository.findById(userId);
    if (!requester) {
         return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Access control:
    // If requester is senior, must match chapter.userId
    // If requester is family, must match requester.seniorId === chapter.userId
    let hasAccess = false;
    if (requester.role === 'senior' && requester.id === chapter.userId) {
        hasAccess = true;
    } else if (requester.role === 'family' && requester.seniorId === chapter.userId) {
        hasAccess = true;
    }

    if (!hasAccess) {
         return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(chapter);
  } catch (error: any) {
    console.error('Error fetching chapter:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
