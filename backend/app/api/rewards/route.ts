// GET /api/rewards - Get user rewards
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../shared/types';

export const GET = withAuth(async (req: any) => {
  try {
    const rewards = await prisma.reward.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(rewards);
  } catch (error) {
    console.error('Get rewards error:', error);
    return errorResponse('Failed to get rewards', ErrorCode.SERVER_ERROR, 500);
  }
});
