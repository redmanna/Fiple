// POST /api/admin/promoted-posts/[id]/reject - Reject promoted post
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin, successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../../../shared/types';

export const POST = withAdmin(async (req: any, { params }: { params: { id: string } }) => {
  try {
    const promotedPostId = params.id;
    const { reason } = await req.json();

    if (!reason) {
      return errorResponse('Rejection reason is required', ErrorCode.VALIDATION_ERROR, 400);
    }

    // Get promoted post
    const promotedPost = await prisma.promotedPost.findUnique({
      where: { id: promotedPostId },
      include: {
        business: true,
      },
    });

    if (!promotedPost) {
      return errorResponse('Promoted post not found', ErrorCode.NOT_FOUND, 404);
    }

    if (promotedPost.status !== 'PENDING_REVIEW') {
      return errorResponse('Promoted post is not pending review', ErrorCode.VALIDATION_ERROR, 400);
    }

    // Reject promoted post
    const updated = await prisma.promotedPost.update({
      where: { id: promotedPostId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
      },
    });

    // Log admin action
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'admin_promoted_post_reject',
        entity: 'PromotedPost',
        entityId: promotedPostId,
        changes: {
          status: 'REJECTED',
          reason,
          postId: promotedPost.postId,
          businessId: promotedPost.businessId,
          businessName: promotedPost.business.businessName,
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Reject promoted post error:', error);
    return errorResponse('Failed to reject promoted post', ErrorCode.SERVER_ERROR, 500);
  }
});
