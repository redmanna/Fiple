// GET /api/admin/users - List all users (admin)
// PUT /api/admin/users/[id] - Update user status
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin, successResponse, errorResponse, getPaginationParams } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../shared/types';

export const GET = withAdmin(async (req: any) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, pageSize, skip, take } = getPaginationParams(new URL(req.url));

    const status = searchParams.get('status'); // active, suspended, banned
    const verificationStatus = searchParams.get('verificationStatus');
    const tier = searchParams.get('tier');
    const search = searchParams.get('search');

    const where: any = {};

    if (status) {
      where.accountStatus = status.toUpperCase();
    }

    if (verificationStatus) {
      where.verificationStatus = verificationStatus.toUpperCase();
    }

    if (tier) {
      where.currentTier = tier;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatar: true,
          role: true,
          accountStatus: true,
          verificationStatus: true,
          followersCount: true,
          postsCount: true,
          currentTier: true,
          createdAt: true,
          lastActiveAt: true,
          wallet: {
            select: {
              balanceNGN: true,
              totalEarned: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      }),

      prisma.user.count({ where }),
    ]);

    return successResponse({
      data: users,
      total,
      page,
      pageSize,
      hasMore: skip + users.length < total,
    });
  } catch (error) {
    console.error('Get users error:', error);
    return errorResponse('Failed to get users', ErrorCode.SERVER_ERROR, 500);
  }
});
