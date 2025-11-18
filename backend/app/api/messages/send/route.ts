// POST /api/messages/send - Send a message
import { NextRequest } from 'next/server';
import { withAuth, successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../shared/types';
import { sendMessage } from '@/lib/messaging';

export const POST = withAuth(async (req: any) => {
  try {
    const { recipientId, content, mediaUrls, mediaTypes, replyToId } = await req.json();

    if (!recipientId || !content) {
      return errorResponse('Recipient and message content are required', ErrorCode.VALIDATION_ERROR, 400);
    }

    const message = await sendMessage(
      req.user.userId,
      recipientId,
      content,
      mediaUrls,
      mediaTypes,
      replyToId
    );

    return successResponse(message);
  } catch (error: any) {
    console.error('Send message error:', error);
    return errorResponse(error.message || 'Failed to send message', ErrorCode.SERVER_ERROR, 500);
  }
});
