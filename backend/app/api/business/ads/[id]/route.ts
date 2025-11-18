// GET /api/business/ads/[id] - Get ad details with analytics
// PUT /api/business/ads/[id] - Update ad (pause, resume, edit)
// DELETE /api/business/ads/[id] - Delete ad
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../../../shared/types';
import { getAdAnalytics } from '@/lib/advertising';

export const GET = withAuth(async (req: any, { params }: { params: { id: string } }) => {
  try {
    const adId = params.id;

    // Get business account
    const businessAccount = await prisma.businessAccount.findUnique({
      where: { userId: req.user.userId },
    });

    if (!businessAccount) {
      return errorResponse('Business account not found', ErrorCode.NOT_FOUND, 404);
    }

    // Get ad with verification it belongs to this business
    const ad = await prisma.advertisement.findFirst({
      where: {
        id: adId,
        businessId: businessAccount.id,
      },
      include: {
        campaign: true,
      },
    });

    if (!ad) {
      return errorResponse('Advertisement not found', ErrorCode.NOT_FOUND, 404);
    }

    // Get detailed analytics
    const analytics = await getAdAnalytics(adId, 7); // Last 7 days

    return successResponse({
      ad,
      analytics,
    });
  } catch (error) {
    console.error('Get ad details error:', error);
    return errorResponse('Failed to get advertisement details', ErrorCode.SERVER_ERROR, 500);
  }
});

export const PUT = withAuth(async (req: any, { params }: { params: { id: string } }) => {
  try {
    const adId = params.id;
    const updates = await req.json();

    // Get business account
    const businessAccount = await prisma.businessAccount.findUnique({
      where: { userId: req.user.userId },
    });

    if (!businessAccount) {
      return errorResponse('Business account not found', ErrorCode.NOT_FOUND, 404);
    }

    // Verify ad belongs to this business
    const ad = await prisma.advertisement.findFirst({
      where: {
        id: adId,
        businessId: businessAccount.id,
      },
    });

    if (!ad) {
      return errorResponse('Advertisement not found', ErrorCode.NOT_FOUND, 404);
    }

    // Don't allow editing active ads (pause first)
    if (ad.status === 'ACTIVE' && updates.title) {
      return errorResponse('Cannot edit active ad. Please pause it first.', ErrorCode.VALIDATION_ERROR, 400);
    }

    // Update ad
    const updated = await prisma.advertisement.update({
      where: { id: adId },
      data: {
        ...updates,
        // If reactivating, set to pending review
        ...(updates.status === 'ACTIVE' && ad.status === 'PAUSED' && { status: 'PENDING_REVIEW' }),
      },
    });

    return successResponse(updated);
  } catch (error) {
    console.error('Update ad error:', error);
    return errorResponse('Failed to update advertisement', ErrorCode.SERVER_ERROR, 500);
  }
});

export const DELETE = withAuth(async (req: any, { params }: { params: { id: string } }) => {
  try {
    const adId = params.id;

    // Get business account
    const businessAccount = await prisma.businessAccount.findUnique({
      where: { userId: req.user.userId },
    });

    if (!businessAccount) {
      return errorResponse('Business account not found', ErrorCode.NOT_FOUND, 404);
    }

    // Verify ad belongs to this business
    const ad = await prisma.advertisement.findFirst({
      where: {
        id: adId,
        businessId: businessAccount.id,
      },
    });

    if (!ad) {
      return errorResponse('Advertisement not found', ErrorCode.NOT_FOUND, 404);
    }

    // Soft delete - mark as deleted
    await prisma.advertisement.update({
      where: { id: adId },
      data: {
        status: 'DELETED',
      },
    });

    return successResponse({ message: 'Advertisement deleted successfully' });
  } catch (error) {
    console.error('Delete ad error:', error);
    return errorResponse('Failed to delete advertisement', ErrorCode.SERVER_ERROR, 500);
  }
});
