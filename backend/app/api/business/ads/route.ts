// POST /api/business/ads - Create advertisement
// GET /api/business/ads - List ads with performance
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../shared/types';

export const POST = withAuth(async (req: any) => {
  try {
    const {
      campaignId,
      format,
      title,
      description,
      imageUrl,
      videoUrl,
      ctaText,
      ctaUrl,
      targeting,
      pricingModel,
      bidAmount,
      totalBudget,
      dailyBudget,
      startDate,
      endDate,
    } = await req.json();

    // Get business account
    const businessAccount = await prisma.businessAccount.findUnique({
      where: { userId: req.user.userId },
    });

    if (!businessAccount) {
      return errorResponse('Business account not found. Please create a business account first.', ErrorCode.NOT_FOUND, 404);
    }

    // Validate required fields
    if (!format || !title || !totalBudget || !pricingModel) {
      return errorResponse('Missing required fields', ErrorCode.VALIDATION_ERROR, 400);
    }

    // Validate budget based on tier
    const minBudget = businessAccount.tier === 'FREE' ? 5000 : 1000;
    if (totalBudget < minBudget) {
      return errorResponse(`Minimum budget is ₦${minBudget}`, ErrorCode.VALIDATION_ERROR, 400);
    }

    // Create advertisement
    const ad = await prisma.advertisement.create({
      data: {
        businessId: businessAccount.id,
        campaignId,
        format,
        title,
        description,
        imageUrl,
        videoUrl,
        ctaText,
        ctaUrl,
        targeting: targeting || {},
        pricingModel,
        bidAmount,
        totalBudget,
        dailyBudget,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        status: 'PENDING_REVIEW', // Requires admin approval
      },
    });

    return successResponse(ad);
  } catch (error) {
    console.error('Create ad error:', error);
    return errorResponse('Failed to create advertisement', ErrorCode.SERVER_ERROR, 500);
  }
});

export const GET = withAuth(async (req: any) => {
  try {
    // Get business account
    const businessAccount = await prisma.businessAccount.findUnique({
      where: { userId: req.user.userId },
    });

    if (!businessAccount) {
      return errorResponse('Business account not found', ErrorCode.NOT_FOUND, 404);
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status');

    const where: any = {
      businessId: businessAccount.id,
    };

    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * pageSize;

    const [ads, total] = await Promise.all([
      prisma.advertisement.findMany({
        where,
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              objective: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.advertisement.count({ where }),
    ]);

    // Calculate performance metrics for each ad
    const adsWithMetrics = ads.map(ad => ({
      ...ad,
      ctr: ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0,
      cpc: ad.clicks > 0 ? ad.totalSpent / ad.clicks : 0,
      cpm: ad.impressions > 0 ? (ad.totalSpent / ad.impressions) * 1000 : 0,
      conversionRate: ad.clicks > 0 ? (ad.conversions / ad.clicks) * 100 : 0,
      budgetUsed: (ad.totalSpent / ad.totalBudget) * 100,
    }));

    return successResponse({
      ads: adsWithMetrics,
      total,
      page,
      pageSize,
      hasMore: skip + ads.length < total,
    });
  } catch (error) {
    console.error('Get ads error:', error);
    return errorResponse('Failed to get advertisements', ErrorCode.SERVER_ERROR, 500);
  }
});
