import { NextRequest, NextResponse } from 'next/server';
import { userProfileUpdater } from '@/lib/infrastructure/di/container';

// Helper to check authorization
async function verifyAccess(req: NextRequest, targetId: string): Promise<boolean> {
    const requesterId = req.headers.get('x-user-id');
    const requesterRole = req.headers.get('x-user-role');

    if (!requesterId) return false;

    // 1. User accessing their own data
    if (requesterId === targetId) return true;

    // 2. Family member accessing their assigned senior's data
    if (requesterRole === 'family') {
        const familyUser = await userProfileUpdater.getProfile(requesterId);
        if (familyUser && familyUser.seniorId === targetId) {
            return true;
        }
    }

    return false;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // SECURITY: Check authorization before processing
        const isAuthorized = await verifyAccess(req, id);
        if (!isAuthorized) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { topicsAvoid } = body;

        // We assume the user calling this is a senior or family member authorized to update preferences.
        // For MVP, we allow updates to preferences.
        // The service method expects a partial of preferences.
        const updatedUser = await userProfileUpdater.updateSeniorProfile(id, { topicsAvoid });

        return NextResponse.json(updatedUser);
    } catch (error: any) {
        console.error('Preferences API Error:', error);
        // SECURITY: Don't leak error details
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // SECURITY: Check authorization before processing
        const isAuthorized = await verifyAccess(req, id);
        if (!isAuthorized) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const user = await userProfileUpdater.getProfile(id);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user.preferences || {});
    } catch (error: any) {
        console.error('Preferences API Error:', error);
        // SECURITY: Don't leak error details
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
