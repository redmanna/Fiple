// POST /api/ads/conversion - Record ad conversion
import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../shared/types';
import { recordAdConversion } from '@/lib/advertising';

export async function POST(req: NextRequest) {
  try {
    const { adId, userId, conversionType, value } = await req.json();

    if (!adId || !conversionType) {
      return errorResponse('Ad ID and conversion type are required', ErrorCode.VALIDATION_ERROR, 400);
    }

    await recordAdConversion(adId, userId || null, conversionType, value);

    return successResponse({ success: true });
  } catch (error) {
    console.error('Record conversion error:', error);
    return errorResponse('Failed to record conversion', ErrorCode.SERVER_ERROR, 500);
  }
}
