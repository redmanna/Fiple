// POST /api/admin/promoted-posts/[id]/approve - Approve promoted post
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin, successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../../../shared/types';

export const POST = withAdmin(async (req: any, { params }: { params: { id: string } }) => {
  try {
    const promotedPostId = params.id;

    // Get promoted post
    const promotedPost = await prisma.promotedPost.findUnique({
      where: { id: promotedPostId },
      include: {
        business: true,
        post: true,
      },
    });

    if (!promotedPost) {
      return errorResponse('Promoted post not found', ErrorCode.NOT_FOUND, 404);
    }

    if (promotedPost.status !== 'PENDING_REVIEW') {
      return errorResponse('Promoted post is not pending review', ErrorCode.VALIDATION_ERROR, 400);
    }

    // Approve promoted post
    const updated = await prisma.promotedPost.update({
      where: { id: promotedPostId },
      data: {
        status: 'ACTIVE',
      },
    });

    // Log admin action
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'admin_promoted_post_approve',
        entity: 'PromotedPost',
        entityId: promotedPostId,
        changes: {
          status: 'ACTIVE',
          postId: promotedPost.postId,
          businessId: promotedPost.businessId,
          businessName: promotedPost.business.businessName,
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Approve promoted post error:', error);
    return errorResponse('Failed to approve promoted post', ErrorCode.SERVER_ERROR, 500);
  }
});
