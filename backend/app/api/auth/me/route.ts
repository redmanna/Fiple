// GET /api/auth/me - Get current user
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../shared/types';

export const GET = withAuth(async (req: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        wallet: true,
        campusHub: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logo: true,
          },
        },
      },
    });

    if (!user) {
      return errorResponse('User not found', ErrorCode.NOT_FOUND, 404);
    }

    return successResponse({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatar: user.avatar,
      coverImage: user.coverImage,
      campusId: user.campusId,
      campusName: user.campusName,
      campusHub: user.campusHub,
      role: user.role,
      accountStatus: user.accountStatus,
      verificationStatus: user.verificationStatus,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      postsCount: user.postsCount,
      totalLikes: user.totalLikes,
      totalShares: user.totalShares,
      currentTier: user.currentTier,
      lowDataMode: user.lowDataMode,
      darkMode: user.darkMode,
      wallet: user.wallet ? {
        balanceNGN: user.wallet.balanceNGN,
        balanceUSD: user.wallet.balanceUSD,
        fipplePoints: user.wallet.fipplePoints,
        totalEarned: user.wallet.totalEarned,
      } : null,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return errorResponse('Failed to get user', ErrorCode.SERVER_ERROR, 500);
  }
});
