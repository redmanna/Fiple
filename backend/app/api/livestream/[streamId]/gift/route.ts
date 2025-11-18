// POST /api/livestream/[streamId]/gift - Send gift during stream
import { NextRequest } from 'next/server';
import { withAuth, successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../../../shared/types';
import { sendLiveGift } from '@/lib/livestream';

export const POST = withAuth(async (req: any, { params }: { params: { streamId: string } }) => {
  try {
    const { giftType, quantity, message } = await req.json();

    if (!giftType) {
      return errorResponse('Gift type is required', ErrorCode.VALIDATION_ERROR, 400);
    }

    const gift = await sendLiveGift(
      params.streamId,
      req.user.userId,
      giftType,
      quantity || 1,
      message
    );

    return successResponse(gift);
  } catch (error: any) {
    console.error('Send gift error:', error);
    return errorResponse(error.message || 'Failed to send gift', ErrorCode.SERVER_ERROR, 500);
  }
});
