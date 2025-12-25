import { NextRequest, NextResponse } from 'next/server';
import { signSession } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const { userId, role, email } = await req.json();

    // ============================================
    // DEPENDENCIES
    // ============================================
    const { userRepository } = await import('@/lib/infrastructure/di/container');
    const { User } = await import('@/lib/core/domain/entities/User');

    let finalUserId = userId;
    let finalRole = role;

    // ============================================
    // EMAIL LOGIN
    // ============================================
    if (email) {
      const user = await userRepository.findByEmail(email);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      finalUserId = user.id;
      finalRole = user.role;
    }

    // ============================================
    // DEV / MVP LOGIN (userId + role)
    // ============================================
    else if (userId && role) {
      // Basic whitelist for dev safety
      const allowedUsers = ['senior-1', 'family-1', 'admin'];
      if (!allowedUsers.includes(userId) && !userId.startsWith('test-') && !userId.match(/^[0-9a-f-]{36}$/)) {
        // Only verify whitelist if NOT a UUID (UUIDs are assumed to be valid created users from signup)
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidPattern.test(userId)) {
          return NextResponse.json({ error: 'Invalid user for MVP login' }, { status: 403 });
        }
      }

      // Generate Dev DB IDs for aliases
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let dbUserId = userId;

      if (userId === 'senior-1') {
        dbUserId = '00000000-0000-0000-0000-000000000001';
      } else if (userId === 'family-1') {
        dbUserId = '00000000-0000-0000-0000-000000000002';
      } else if (!uuidPattern.test(userId)) {
        // Hash non-UUIDs just to be safe if they bypassed whitelist
        const crypto = await import('crypto');
        let hash = crypto.createHash('md5').update(userId).digest('hex');
        dbUserId = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
      }

      // Check existence & Auto-create Dev Users
      let existingUser = await userRepository.findById(dbUserId);
      if (!existingUser) {
        if (allowedUsers.includes(userId)) {
          existingUser = new User(
            dbUserId,
            userId === 'senior-1' ? 'Arthur' : userId,
            `${userId}@example.com`,
            role as 'senior' | 'family',
            undefined,
            undefined,
            {
              topicsLove: ['Family History', 'Gardening'],
              topicsAvoid: ['Politics'],
              timezone: 'Europe/Rome'
            }
          );
          await userRepository.create(existingUser);
          console.log(`Created dev user in database: ${userId} (${dbUserId})`);
        } else {
          // For non-dev users passed by ID, if they don't exist, fail (Signup should create them)
          return NextResponse.json({ error: 'User does not exist. Please signup.' }, { status: 404 });
        }
      }
      finalUserId = dbUserId;
    } else {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }

    // ============================================
    // SESSION CREATION
    // ============================================
    const token = await signSession({ userId: finalUserId, role: finalRole });

    const response = NextResponse.json({ success: true, userId: finalUserId, role: finalRole });

    // Set HTTP-only cookie
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
