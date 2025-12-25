import { NextRequest, NextResponse } from 'next/server';
import { exportBookUseCase } from '@/lib/infrastructure/di/container';
import { logger } from '@/lib/core/application/Logger';

/**
 * POST /api/storybooks/export
 * 
 * Exports the user's complete storybook as a PDF.
 * Returns a PDF buffer that can be downloaded by the client.
 */
export async function POST(req: NextRequest) {
    const traceId = req.headers.get('x-trace-id') || crypto.randomUUID();

    try {
        // Get user ID from middleware-injected header
        const userId = req.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        logger.info('Exporting storybook for user', { traceId, userId });

        // Generate PDF using the use case
        const pdfBuffer = await exportBookUseCase.execute(userId);

        // Convert Buffer to Uint8Array for NextResponse compatibility
        const pdfBytes = new Uint8Array(pdfBuffer);

        // Return the PDF with appropriate headers
        return new NextResponse(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="storybook-${userId}.pdf"`,
                'Content-Length': pdfBytes.length.toString(),
            },
        });
    } catch (error: any) {
        logger.error('Storybook export failed', {
            traceId,
            error: error.message,
        });

        return NextResponse.json(
            { error: 'Failed to export storybook' },
            { status: 500 }
        );
    }
}
