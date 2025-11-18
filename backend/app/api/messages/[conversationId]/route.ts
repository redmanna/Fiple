// GET /api/messages/[conversationId] - Get messages in conversation
import { NextRequest } from 'next/server';
import { withAuth, successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../../../shared/types';
import { getConversationMessages } from '@/lib/messaging';

export const GET = withAuth(async (req: any, { params }: { params: { conversationId: string } }) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    const messages = await getConversationMessages(
      params.conversationId,
      req.user.userId,
      page,
      pageSize
    );

    return successResponse(messages);
  } catch (error: any) {
    console.error('Get messages error:', error);
    return errorResponse(error.message || 'Failed to get messages', ErrorCode.SERVER_ERROR, 500);
  }
});
