
import { db } from '@/lib/infrastructure/adapters/db';
import { chapters } from '@/lib/infrastructure/adapters/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id;

    let chapter: any;
    try {
      const result = await db.select()
        .from(chapters)
        .where(eq(chapters.id, id))
        .limit(1);
      chapter = result[0];
    } catch (e) {
      console.error("DB select chapter detail failed:", e);
      return NextResponse.json(
        { error: 'Database error fetching chapter' },
        { status: 500 }
      );
    }

    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(chapter);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch chapter' },
      { status: 500 }
    );
  }
}
