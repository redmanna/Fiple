// POST /api/messages/[messageId]/react - React to message
import { NextRequest } from 'next/server';
import { withAuth, successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../../../shared/types';
import { reactToMessage } from '@/lib/messaging';

export const POST = withAuth(async (req: any, { params }: { params: { messageId: string } }) => {
  try {
    const { emoji } = await req.json();

    if (!emoji) {
      return errorResponse('Emoji is required', ErrorCode.VALIDATION_ERROR, 400);
    }

    const result = await reactToMessage(params.messageId, req.user.userId, emoji);
    return successResponse(result);
  } catch (error: any) {
    console.error('React to message error:', error);
    return errorResponse(error.message || 'Failed to react', ErrorCode.SERVER_ERROR, 500);
  }
});
