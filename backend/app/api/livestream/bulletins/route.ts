// POST /api/livestream/bulletins - Create bulletin
// GET /api/livestream/bulletins - Get bulletins
import { NextRequest } from 'next/server';
import { withAuth, successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../shared/types';
import { createBulletin, getUserBulletins } from '@/lib/livestream';

export const POST = withAuth(async (req: any) => {
  try {
    const { title, content, tier, isPublic } = await req.json();

    if (!title || !content) {
      return errorResponse('Title and content are required', ErrorCode.VALIDATION_ERROR, 400);
    }

    const bulletin = await createBulletin(
      req.user.userId,
      title,
      content,
      tier,
      isPublic || false
    );

    return successResponse(bulletin);
  } catch (error: any) {
    console.error('Create bulletin error:', error);
    return errorResponse(error.message || 'Failed to create bulletin', ErrorCode.SERVER_ERROR, 500);
  }
});

export const GET = withAuth(async (req: any) => {
  try {
    const { searchParams } = new URL(req.url);
    const hostId = searchParams.get('hostId');

    if (!hostId) {
      return errorResponse('Host ID is required', ErrorCode.VALIDATION_ERROR, 400);
    }

    const bulletins = await getUserBulletins(req.user.userId, hostId);

    return successResponse(bulletins);
  } catch (error: any) {
    console.error('Get bulletins error:', error);
    return errorResponse(error.message || 'Failed to get bulletins', ErrorCode.SERVER_ERROR, 500);
  }
});
