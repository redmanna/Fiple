// GET /api/livestream/[streamId]/rankings - Get viewer rankings
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../../../shared/types';

export async function GET(req: NextRequest, { params }: { params: { streamId: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const rankings = await prisma.liveViewer.findMany({
      where: {
        streamId: params.streamId,
        leftAt: null, // Active viewers only
      },
      orderBy: {
        engagementScore: 'desc',
      },
      take: limit,
      select: {
        id: true,
        userId: true,
        username: true,
        displayName: true,
        avatar: true,
        rank: true,
        engagementScore: true,
        giftsCount: true,
        giftsValue: true,
        commentsCount: true,
        badges: true,
        joinedAt: true,
        watchDuration: true,
      },
    });

    return successResponse(rankings);
  } catch (error) {
    console.error('Get rankings error:', error);
    return errorResponse('Failed to get rankings', ErrorCode.SERVER_ERROR, 500);
  }
}
