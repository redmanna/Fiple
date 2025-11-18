// POST /api/business/campaigns - Create ad campaign
// GET /api/business/campaigns - List campaigns
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../shared/types';

export const POST = withAuth(async (req: any) => {
  try {
    const { name, objective, description, totalBudget, startDate, endDate } = await req.json();

    // Get business account
    const businessAccount = await prisma.businessAccount.findUnique({
      where: { userId: req.user.userId },
    });

    if (!businessAccount) {
      return errorResponse('Business account not found', ErrorCode.NOT_FOUND, 404);
    }

    // Validate required fields
    if (!name || !objective || !totalBudget) {
      return errorResponse('Missing required fields', ErrorCode.VALIDATION_ERROR, 400);
    }

    // Create campaign
    const campaign = await prisma.adCampaign.create({
      data: {
        businessId: businessAccount.id,
        name,
        objective,
        description,
        totalBudget,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        status: 'ACTIVE',
      },
    });

    return successResponse(campaign);
  } catch (error) {
    console.error('Create campaign error:', error);
    return errorResponse('Failed to create campaign', ErrorCode.SERVER_ERROR, 500);
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

    const campaigns = await prisma.adCampaign.findMany({
      where: {
        businessId: businessAccount.id,
      },
      include: {
        _count: {
          select: {
            advertisements: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate campaign metrics
    const campaignsWithMetrics = await Promise.all(
      campaigns.map(async campaign => {
        const ads = await prisma.advertisement.findMany({
          where: { campaignId: campaign.id },
          select: {
            totalSpent: true,
            impressions: true,
            clicks: true,
            conversions: true,
          },
        });

        const totalSpent = ads.reduce((sum, ad) => sum + ad.totalSpent, 0);
        const totalImpressions = ads.reduce((sum, ad) => sum + ad.impressions, 0);
        const totalClicks = ads.reduce((sum, ad) => sum + ad.clicks, 0);
        const totalConversions = ads.reduce((sum, ad) => sum + ad.conversions, 0);

        return {
          ...campaign,
          totalSpent,
          totalImpressions,
          totalClicks,
          totalConversions,
          ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
          conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
          budgetUsed: (totalSpent / campaign.totalBudget) * 100,
        };
      })
    );

    return successResponse(campaignsWithMetrics);
  } catch (error) {
    console.error('Get campaigns error:', error);
    return errorResponse('Failed to get campaigns', ErrorCode.SERVER_ERROR, 500);
  }
});
