// POST /api/livestream/[streamId]/join - Join live stream as viewer
import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../../../shared/types';
import { joinLiveStream } from '@/lib/livestream';

export async function POST(req: NextRequest, { params }: { params: { streamId: string } }) {
  try {
    const { userId, username, displayName, avatar } = await req.json();

    const viewer = await joinLiveStream(
      params.streamId,
      userId,
      username,
      displayName,
      avatar
    );

    return successResponse(viewer);
  } catch (error: any) {
    console.error('Join stream error:', error);
    return errorResponse(error.message || 'Failed to join stream', ErrorCode.SERVER_ERROR, 500);
  }
}
