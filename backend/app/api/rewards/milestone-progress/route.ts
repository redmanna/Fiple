// GET /api/rewards/milestone-progress - Get milestone progress
import { NextRequest } from 'next/server';
import { withAuth, successResponse, errorResponse } from '@/lib/middleware';
import { getMilestoneProgress } from '@/lib/rewards';
import { ErrorCode } from '@/../../../../../../shared/types';

export const GET = withAuth(async (req: any) => {
  try {
    const progress = await getMilestoneProgress(req.user.userId);

    if (!progress) {
      return errorResponse('User not found', ErrorCode.NOT_FOUND, 404);
    }

    return successResponse(progress);
  } catch (error) {
    console.error('Get milestone progress error:', error);
    return errorResponse('Failed to get milestone progress', ErrorCode.SERVER_ERROR, 500);
  }
});
