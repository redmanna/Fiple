// POST /api/livestream/create - Create new live stream
import { NextRequest } from 'next/server';
import { withAuth, successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../shared/types';
import { createLiveStream } from '@/lib/livestream';

export const POST = withAuth(async (req: any) => {
  try {
    const { title, description, scheduledAt, subscribersOnly } = await req.json();

    if (!title) {
      return errorResponse('Title is required', ErrorCode.VALIDATION_ERROR, 400);
    }

    const stream = await createLiveStream(
      req.user.userId,
      title,
      description,
      scheduledAt ? new Date(scheduledAt) : undefined,
      subscribersOnly
    );

    return successResponse(stream);
  } catch (error: any) {
    console.error('Create live stream error:', error);
    return errorResponse(error.message || 'Failed to create stream', ErrorCode.SERVER_ERROR, 500);
  }
});
