// POST /api/livestream/[streamId]/leave - Leave live stream
import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../../../shared/types';
import { leaveLiveStream } from '@/lib/livestream';

export async function POST(req: NextRequest, { params }: { params: { streamId: string } }) {
  try {
    const { viewerId, watchDuration } = await req.json();

    if (!viewerId || watchDuration === undefined) {
      return errorResponse('Viewer ID and watch duration are required', ErrorCode.VALIDATION_ERROR, 400);
    }

    await leaveLiveStream(viewerId, watchDuration);

    return successResponse({ success: true });
  } catch (error: any) {
    console.error('Leave stream error:', error);
    return errorResponse(error.message || 'Failed to leave stream', ErrorCode.SERVER_ERROR, 500);
  }
}
