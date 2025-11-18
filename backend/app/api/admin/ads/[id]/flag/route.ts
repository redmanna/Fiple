// POST /api/admin/ads/[id]/flag - Flag ad for review (pause if active)
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withAdmin, successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../../../shared/types';

export const POST = withAdmin(async (req: any, { params }: { params: { id: string } }) => {
  try {
    const adId = params.id;
    const { reason } = await req.json();

    if (!reason) {
      return errorResponse('Flag reason is required', ErrorCode.VALIDATION_ERROR, 400);
    }

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

    // Flag ad (pause if active)
    const updated = await prisma.advertisement.update({
      where: { id: adId },
      data: {
        status: 'FLAGGED',
        flagReason: reason,
      },
    });

    // Log admin action
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'admin_ad_flag',
        entity: 'Advertisement',
        entityId: adId,
        changes: {
          status: 'FLAGGED',
          reason,
          previousStatus: ad.status,
          businessId: ad.businessId,
          businessName: ad.business.businessName,
        },
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    // TODO: Send notification to business owner

    return successResponse(updated);
  } catch (error) {
    console.error('Flag ad error:', error);
    return errorResponse('Failed to flag ad', ErrorCode.SERVER_ERROR, 500);
  }
});
