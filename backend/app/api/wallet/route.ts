// GET /api/wallet - Get wallet info
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../shared/types';

export const GET = withAuth(async (req: any) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user.userId },
    });

    if (!wallet) {
      // Create wallet if doesn't exist
      const newWallet = await prisma.wallet.create({
        data: { userId: req.user.userId },
      });
      return successResponse(newWallet);
    }

    return successResponse(wallet);
  } catch (error) {
    console.error('Get wallet error:', error);
    return errorResponse('Failed to get wallet', ErrorCode.SERVER_ERROR, 500);
  }
});
