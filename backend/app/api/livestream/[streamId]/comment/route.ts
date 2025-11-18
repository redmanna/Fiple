// POST /api/livestream/[streamId]/comment - Post comment in stream
import { NextRequest } from 'next/server';
import { withAuth, successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../../../shared/types';
import { postLiveComment } from '@/lib/livestream';

export const POST = withAuth(async (req: any, { params }: { params: { streamId: string } }) => {
  try {
    const { content, username } = await req.json();

    if (!content) {
      return errorResponse('Comment content is required', ErrorCode.VALIDATION_ERROR, 400);
    }

    const comment = await postLiveComment(
      params.streamId,
      req.user.userId,
      username || 'User',
      content
    );

    return successResponse(comment);
  } catch (error: any) {
    console.error('Post comment error:', error);
    return errorResponse(error.message || 'Failed to post comment', ErrorCode.SERVER_ERROR, 500);
  }
});
