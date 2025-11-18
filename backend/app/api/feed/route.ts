// GET /api/feed - Get personalized feed
import { NextRequest } from 'next/server';
import { withAuth, successResponse, errorResponse } from '@/lib/middleware';
import { getPersonalizedFeed } from '@/lib/feed-algorithm';
import { ErrorCode, ContentType } from '@/../../../../shared/types';

export const GET = withAuth(async (req: any) => {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const contentType = searchParams.get('contentType') as ContentType | undefined;
    const campusHubId = searchParams.get('campusHubId') || undefined;
    const sortBy = (searchParams.get('sortBy') as 'recent' | 'trending' | 'top') || 'trending';

    const feed = await getPersonalizedFeed({
      userId: req.user.userId,
      page,
      pageSize,
      contentType,
      campusHubId,
      sortBy,
    });

    return successResponse(feed);
  } catch (error) {
    console.error('Get feed error:', error);
    return errorResponse('Failed to get feed', ErrorCode.SERVER_ERROR, 500);
  }
});
