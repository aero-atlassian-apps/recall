import { NextRequest, NextResponse } from 'next/server';
import { exportBookUseCase } from '@/lib/infrastructure/di/container';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        // SECURITY: Verify user is authorized to access this resource
        const authenticatedUserId = request.headers.get('x-user-id');

        // Block IDOR: Only allow access if authenticated user matches requested ID
        // TODO: Add family member check if needed in future
        if (!authenticatedUserId || authenticatedUserId !== id) {
            console.warn(`[Security] IDOR attempt blocked. User: ${authenticatedUserId}, Target: ${id}`);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const pdfBuffer = await exportBookUseCase.execute(id);

        // Convert Buffer to Blob for strict type compatibility with NextResponse BodyInit
        // Explicitly cast to any to bypass the Buffer/ArrayBuffer mismatch in strict mode
        const blob = new Blob([pdfBuffer as any], { type: 'application/pdf' });

        return new NextResponse(blob, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="life-story-${id}.pdf"`,
            },
        });
    } catch (error: any) {
        console.error("Export failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
