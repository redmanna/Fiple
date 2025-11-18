// POST /api/livestream/[streamId]/start - Start live stream
import { NextRequest } from 'next/server';
import { withAuth, successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../../../shared/types';
import { startLiveStream } from '@/lib/livestream';

export const POST = withAuth(async (req: any, { params }: { params: { streamId: string } }) => {
  try {
    const stream = await startLiveStream(params.streamId, req.user.userId);
    return successResponse(stream);
  } catch (error: any) {
    console.error('Start stream error:', error);
    return errorResponse(error.message || 'Failed to start stream', ErrorCode.SERVER_ERROR, 500);
  }
});
