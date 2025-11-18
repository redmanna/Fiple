// POST /api/messages/[messageId]/delete - Delete message
import { NextRequest } from 'next/server';
import { withAuth, successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../../../shared/types';
import { deleteMessage } from '@/lib/messaging';

export const POST = withAuth(async (req: any, { params }: { params: { messageId: string } }) => {
  try {
    await deleteMessage(params.messageId, req.user.userId);
    return successResponse({ success: true });
  } catch (error: any) {
    console.error('Delete message error:', error);
    return errorResponse(error.message || 'Failed to delete message', ErrorCode.SERVER_ERROR, 500);
  }
});
