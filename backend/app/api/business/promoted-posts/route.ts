// POST /api/business/promoted-posts - Create promoted post
// GET /api/business/promoted-posts - List promoted posts
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../shared/types';

export const POST = withAuth(async (req: any) => {
  try {
    const { postId, budget, duration, targetAudience } = await req.json();

    // Get business account
    const businessAccount = await prisma.businessAccount.findUnique({
      where: { userId: req.user.userId },
    });

    if (!businessAccount) {
      return errorResponse('Business account not found', ErrorCode.NOT_FOUND, 404);
    }

    // Validate post exists and belongs to user
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        userId: req.user.userId,
      },
    });

    if (!post) {
      return errorResponse('Post not found', ErrorCode.NOT_FOUND, 404);
    }

    // Validate budget
    const minBudget = 1000; // ₦1,000 minimum
    if (budget < minBudget) {
      return errorResponse(`Minimum budget is ₦${minBudget}`, ErrorCode.VALIDATION_ERROR, 400);
    }

    // Calculate end date based on duration (in days)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (duration || 7));

    // Create promoted post
    const promotedPost = await prisma.promotedPost.create({
      data: {
        postId,
        businessId: businessAccount.id,
        budget,
        startDate: new Date(),
        endDate,
        targetAudience: targetAudience || {},
        status: 'PENDING_REVIEW',
      },
    });

    return successResponse(promotedPost);
  } catch (error) {
    console.error('Create promoted post error:', error);
    return errorResponse('Failed to create promoted post', ErrorCode.SERVER_ERROR, 500);
  }
});

export const GET = withAuth(async (req: any) => {
  try {
    // Get business account
    const businessAccount = await prisma.businessAccount.findUnique({
      where: { userId: req.user.userId },
    });

    if (!businessAccount) {
      return errorResponse('Business account not found', ErrorCode.NOT_FOUND, 404);
    }

    const promotedPosts = await prisma.promotedPost.findMany({
      where: {
        businessId: businessAccount.id,
      },
      include: {
        post: {
          select: {
            id: true,
            caption: true,
            mediaUrls: true,
            contentType: true,
            createdAt: true,
            likesCount: true,
            commentsCount: true,
            sharesCount: true,
            viewsCount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate metrics for each promoted post
    const postsWithMetrics = promotedPosts.map(pp => ({
      ...pp,
      spent: pp.spent || 0,
      budgetUsed: (pp.spent / pp.budget) * 100,
      ctr: pp.impressions > 0 ? (pp.clicks / pp.impressions) * 100 : 0,
      engagementRate:
        pp.impressions > 0
          ? ((pp.post.likesCount + pp.post.commentsCount + pp.post.sharesCount) / pp.impressions) * 100
          : 0,
      daysRemaining: Math.max(
        0,
        Math.ceil((pp.endDate.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000))
      ),
    }));

    return successResponse(postsWithMetrics);
  } catch (error) {
    console.error('Get promoted posts error:', error);
    return errorResponse('Failed to get promoted posts', ErrorCode.SERVER_ERROR, 500);
  }
});
