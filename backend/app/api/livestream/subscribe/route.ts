// POST /api/livestream/subscribe - Subscribe to creator
import { NextRequest } from 'next/server';
import { withAuth, successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../shared/types';
import { subscribeToCreator } from '@/lib/livestream';

export const POST = withAuth(async (req: any) => {
  try {
    const { hostId, tier } = await req.json();

    if (!hostId || !tier) {
      return errorResponse('Host ID and tier are required', ErrorCode.VALIDATION_ERROR, 400);
    }

    if (!['BASIC', 'PREMIUM', 'VIP'].includes(tier)) {
      return errorResponse('Invalid tier', ErrorCode.VALIDATION_ERROR, 400);
    }

    const subscription = await subscribeToCreator(req.user.userId, hostId, tier);

    return successResponse(subscription);
  } catch (error: any) {
    console.error('Subscribe error:', error);
    return errorResponse(error.message || 'Failed to subscribe', ErrorCode.SERVER_ERROR, 500);
  }
});
