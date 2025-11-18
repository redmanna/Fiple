// GET /api/admin/promoted-posts/pending - Get promoted posts pending review
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

    const [promotedPosts, total] = await Promise.all([
      prisma.promotedPost.findMany({
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
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                },
              },
            },
          },
          post: {
            select: {
              id: true,
              caption: true,
              mediaUrls: true,
              contentType: true,
              createdAt: true,
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: pageSize,
      }),
      prisma.promotedPost.count({
        where: { status: 'PENDING_REVIEW' },
      }),
    ]);

    return successResponse({
      promotedPosts,
      total,
      page,
      pageSize,
      hasMore: skip + promotedPosts.length < total,
    });
  } catch (error) {
    console.error('Get pending promoted posts error:', error);
    return errorResponse('Failed to get pending promoted posts', ErrorCode.SERVER_ERROR, 500);
  }
});
