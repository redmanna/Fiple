// POST /api/ads/click - Record ad click
import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../shared/types';
import { recordAdClick } from '@/lib/advertising';

export async function POST(req: NextRequest) {
  try {
    const { adId, userId } = await req.json();

    if (!adId) {
      return errorResponse('Ad ID is required', ErrorCode.VALIDATION_ERROR, 400);
    }

    await recordAdClick(adId, userId || null);

    return successResponse({ success: true });
  } catch (error) {
    console.error('Record click error:', error);
    return errorResponse('Failed to record click', ErrorCode.SERVER_ERROR, 500);
  }
}
