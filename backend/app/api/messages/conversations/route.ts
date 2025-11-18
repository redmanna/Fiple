// GET /api/messages/conversations - Get user's inbox
import { NextRequest } from 'next/server';
import { withAuth, successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../shared/types';
import { getUserConversations } from '@/lib/messaging';

export const GET = withAuth(async (req: any) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const inbox = await getUserConversations(req.user.userId, page, pageSize);

    return successResponse(inbox);
  } catch (error) {
    console.error('Get conversations error:', error);
    return errorResponse('Failed to get conversations', ErrorCode.SERVER_ERROR, 500);
  }
});
