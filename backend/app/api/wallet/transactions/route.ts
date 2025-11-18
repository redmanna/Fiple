// GET /api/wallet/transactions - Get transaction history
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, successResponse, errorResponse, getPaginationParams } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../shared/types';

export const GET = withAuth(async (req: any) => {
  try {
    const { page, pageSize, skip, take } = getPaginationParams(new URL(req.url));

    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    const total = await prisma.transaction.count({
      where: { userId: req.user.userId },
    });

    return successResponse({
      data: transactions,
      total,
      page,
      pageSize,
      hasMore: skip + transactions.length < total,
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    return errorResponse('Failed to get transactions', ErrorCode.SERVER_ERROR, 500);
  }
});
