// POST /api/auth/register - User Registration
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode, ApiResponse, AuthResponse } from '@/../../../../shared/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, username, password, displayName, campusId, dateOfBirth } = body;

    // Validation
    if (!email || !username || !password || !displayName) {
      return errorResponse(
        'Missing required fields',
        ErrorCode.VALIDATION_ERROR,
        400
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return errorResponse(
        existingUser.email === email
          ? 'Email already registered'
          : 'Username already taken',
        ErrorCode.VALIDATION_ERROR,
        400
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        displayName,
        campusId,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        role: 'USER',
        accountStatus: 'PENDING_VERIFICATION',
        verificationStatus: 'UNVERIFIED',
      },
    });

    // Create wallet for user
    await prisma.wallet.create({
      data: {
        userId: user.id,
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

    return successResponse(response, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return errorResponse('Registration failed', ErrorCode.SERVER_ERROR, 500);
  }
}
