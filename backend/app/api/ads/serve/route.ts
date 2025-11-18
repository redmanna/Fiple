// GET /api/ads/serve - Get ads for current user's feed
import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../shared/types';
import { getAdsForUser } from '@/lib/advertising';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const placement = searchParams.get('placement') || 'feed';
    const limit = parseInt(searchParams.get('limit') || '1');

    // Get ads for user (targeting applied)
    const ads = userId
      ? await getAdsForUser(userId, placement, limit)
      : [];

    return successResponse(ads);
  } catch (error) {
    console.error('Serve ads error:', error);
    return errorResponse('Failed to serve ads', ErrorCode.SERVER_ERROR, 500);
  }
}
