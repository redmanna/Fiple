// POST /api/ads/impression - Record ad impression
import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../shared/types';
import { recordAdImpression } from '@/lib/advertising';

export async function POST(req: NextRequest) {
  try {
    const { adId, userId, placement } = await req.json();

    if (!adId) {
      return errorResponse('Ad ID is required', ErrorCode.VALIDATION_ERROR, 400);
    }

    await recordAdImpression(adId, userId || null, placement || 'feed');

    return successResponse({ success: true });
  } catch (error) {
    console.error('Record impression error:', error);
    return errorResponse('Failed to record impression', ErrorCode.SERVER_ERROR, 500);
  }
}
