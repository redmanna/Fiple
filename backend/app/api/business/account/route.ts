// POST /api/business/account - Create or upgrade business account
// GET /api/business/account - Get business account details
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../shared/types';

export const POST = withAuth(async (req: any) => {
  try {
    const { businessName, category, description, website, phone, tier } = await req.json();

    // Validate required fields
    if (!businessName || !category) {
      return errorResponse('Business name and category are required', ErrorCode.VALIDATION_ERROR, 400);
    }

    // Check if user already has a business account
    const existing = await prisma.businessAccount.findUnique({
      where: { userId: req.user.userId },
    });

    if (existing) {
      // Update existing account (upgrade tier)
      const updated = await prisma.businessAccount.update({
        where: { id: existing.id },
        data: {
          businessName,
          category,
          description,
          website,
          phone,
          tier: tier || existing.tier,
        },
      });

      return successResponse(updated);
    }

    // Create new business account
    const businessAccount = await prisma.businessAccount.create({
      data: {
        userId: req.user.userId,
        businessName,
        category,
        description,
        website,
        phone,
        tier: tier || 'FREE',
        isVerified: false,
      },
    });

    return successResponse(businessAccount);
  } catch (error) {
    console.error('Create business account error:', error);
    return errorResponse('Failed to create business account', ErrorCode.SERVER_ERROR, 500);
  }
});

export const GET = withAuth(async (req: any) => {
  try {
    const businessAccount = await prisma.businessAccount.findUnique({
      where: { userId: req.user.userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            advertisements: true,
            campaigns: true,
            promotedPosts: true,
          },
        },
      },
    });

    if (!businessAccount) {
      return errorResponse('Business account not found', ErrorCode.NOT_FOUND, 404);
    }

    return successResponse(businessAccount);
  } catch (error) {
    console.error('Get business account error:', error);
    return errorResponse('Failed to get business account', ErrorCode.SERVER_ERROR, 500);
  }
});
