// GET /api/admin/moderation - Get moderation queue
import { NextRequest } from 'next/server';
import { withAdmin, successResponse, errorResponse } from '@/lib/middleware';
import { getModerationQueue } from '@/lib/admin-analytics';
import { ErrorCode } from '@/../../../../../../shared/types';

export const GET = withAdmin(async (req: any) => {
  try {
    const queue = await getModerationQueue();
    return successResponse(queue);
  } catch (error) {
    console.error('Get moderation queue error:', error);
    return errorResponse('Failed to get moderation queue', ErrorCode.SERVER_ERROR, 500);
  }
});
