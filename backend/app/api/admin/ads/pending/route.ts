// GET /api/admin/ads/pending - Get ads pending review
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin, successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../shared/types';

export const GET = withAdmin(async (req: any) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const skip = (page - 1) * pageSize;

    const [ads, total] = await Promise.all([
      prisma.advertisement.findMany({
        where: {
          status: 'PENDING_REVIEW',
        },
        include: {
          business: {
            select: {
              id: true,
              businessName: true,
              category: true,
              tier: true,
              isVerified: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                },
              },
            },
          },
          campaign: {
            select: {
              id: true,
              name: true,
              objective: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' }, // Oldest first
        skip,
        take: pageSize,
      }),
      prisma.advertisement.count({
        where: { status: 'PENDING_REVIEW' },
      }),
    ]);

    return successResponse({
      ads,
      total,
      page,
      pageSize,
      hasMore: skip + ads.length < total,
    });
  } catch (error) {
    console.error('Get pending ads error:', error);
    return errorResponse('Failed to get pending ads', ErrorCode.SERVER_ERROR, 500);
  }
});
