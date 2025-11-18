// POST /api/auth/login - User Login
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, generateToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode, AuthResponse } from '@/../../../../shared/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse(
        'Email and password are required',
        ErrorCode.VALIDATION_ERROR,
        400
      );
    }

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username: email }],
      },
    });

    if (!user) {
      return errorResponse(
        'Invalid credentials',
        ErrorCode.UNAUTHORIZED,
        401
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return errorResponse(
        'Invalid credentials',
        ErrorCode.UNAUTHORIZED,
        401
      );
    }

    // Check if account is banned/suspended
    if (user.accountStatus === 'BANNED' || user.accountStatus === 'SUSPENDED') {
      return errorResponse(
        `Account is ${user.accountStatus.toLowerCase()}`,
        ErrorCode.FORBIDDEN,
        403
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastActiveAt: new Date(),
      },
    });

    // Generate token
    const token = generateToken(user);

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio || undefined,
        avatar: user.avatar || undefined,
        coverImage: user.coverImage || undefined,
        campusId: user.campusId || undefined,
        campusName: user.campusName || undefined,
        role: user.role as any,
        accountStatus: user.accountStatus as any,
        verificationStatus: user.verificationStatus as any,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        postsCount: user.postsCount,
        totalLikes: user.totalLikes,
        totalShares: user.totalShares,
        currentTier: user.currentTier || undefined,
        lowDataMode: user.lowDataMode,
        darkMode: user.darkMode,
        createdAt: user.createdAt,
      },
      token,
    };

    return successResponse(response);
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Login failed', ErrorCode.SERVER_ERROR, 500);
  }
}
