// POST /api/admin/ads/[id]/approve - Approve ad
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin, successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../../../shared/types';

export const POST = withAdmin(async (req: any, { params }: { params: { id: string } }) => {
  try {
    const adId = params.id;

    // Get ad
    const ad = await prisma.advertisement.findUnique({
      where: { id: adId },
      include: {
        business: true,
      },
    });

    if (!ad) {
      return errorResponse('Advertisement not found', ErrorCode.NOT_FOUND, 404);
    }

    if (ad.status !== 'PENDING_REVIEW') {
      return errorResponse('Ad is not pending review', ErrorCode.VALIDATION_ERROR, 400);
    }

    // Approve ad
    const updated = await prisma.advertisement.update({
      where: { id: adId },
      data: {
        status: 'ACTIVE',
        approvedAt: new Date(),
        approvedBy: req.user.userId,
      },
    });

    // Log admin action
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'admin_ad_approve',
        entity: 'Advertisement',
        entityId: adId,
        changes: {
          status: 'ACTIVE',
          businessId: ad.businessId,
          businessName: ad.business.businessName,
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    // TODO: Send notification to business owner

    return successResponse(updated);
  } catch (error) {
    console.error('Approve ad error:', error);
    return errorResponse('Failed to approve ad', ErrorCode.SERVER_ERROR, 500);
  }
});
