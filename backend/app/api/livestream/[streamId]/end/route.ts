// POST /api/livestream/[streamId]/end - End live stream
import { NextRequest } from 'next/server';
import { withAuth, successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../../../shared/types';
import { endLiveStream } from '@/lib/livestream';

export const POST = withAuth(async (req: any, { params }: { params: { streamId: string } }) => {
  try {
    const stream = await endLiveStream(params.streamId, req.user.userId);
    return successResponse(stream);
  } catch (error: any) {
    console.error('End stream error:', error);
    return errorResponse(error.message || 'Failed to end stream', ErrorCode.SERVER_ERROR, 500);
  }
});
