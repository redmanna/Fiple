// GET /api/business/analytics - Business dashboard analytics
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../shared/types';

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
    const timeRange = searchParams.get('timeRange') || '7d'; // 24h, 7d, 30d, all

    // Calculate date range
    let startDate: Date;
    const now = new Date();

    switch (timeRange) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Get all ads for this business
    const ads = await prisma.advertisement.findMany({
      where: {
        businessId: businessAccount.id,
        createdAt: { gte: startDate },
      },
      include: {
        campaign: {
          select: {
            name: true,
            objective: true,
          },
        },
      },
    });

    // Calculate overall metrics
    const totalSpent = ads.reduce((sum, ad) => sum + ad.totalSpent, 0);
    const totalBudget = ads.reduce((sum, ad) => sum + ad.totalBudget, 0);
    const totalImpressions = ads.reduce((sum, ad) => sum + ad.impressions, 0);
    const totalClicks = ads.reduce((sum, ad) => sum + ad.clicks, 0);
    const totalConversions = ads.reduce((sum, ad) => sum + ad.conversions, 0);

    const overview = {
      totalAds: ads.length,
      activeAds: ads.filter(ad => ad.status === 'ACTIVE').length,
      totalSpent,
      totalBudget,
      budgetRemaining: totalBudget - totalSpent,
      totalImpressions,
      totalClicks,
      totalConversions,
      averageCTR: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      averageCPC: totalClicks > 0 ? totalSpent / totalClicks : 0,
      averageCPM: totalImpressions > 0 ? (totalSpent / totalImpressions) * 1000 : 0,
      conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      costPerConversion: totalConversions > 0 ? totalSpent / totalConversions : 0,
    };

    // Performance by ad format
    const performanceByFormat: Record<string, any> = {};
    ads.forEach(ad => {
      if (!performanceByFormat[ad.format]) {
        performanceByFormat[ad.format] = {
          count: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          spent: 0,
        };
      }
      performanceByFormat[ad.format].count++;
      performanceByFormat[ad.format].impressions += ad.impressions;
      performanceByFormat[ad.format].clicks += ad.clicks;
      performanceByFormat[ad.format].conversions += ad.conversions;
      performanceByFormat[ad.format].spent += ad.totalSpent;
    });

    // Top performing ads
    const topAds = ads
      .map(ad => ({
        id: ad.id,
        title: ad.title,
        format: ad.format,
        impressions: ad.impressions,
        clicks: ad.clicks,
        conversions: ad.conversions,
        ctr: ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0,
        spent: ad.totalSpent,
        campaignName: ad.campaign?.name,
      }))
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, 10);

    // Daily performance trend
    const impressionsByDate = await prisma.adImpression.groupBy({
      by: ['createdAt'],
      where: {
        advertisement: {
          businessId: businessAccount.id,
        },
        createdAt: { gte: startDate },
      },
      _count: {
        id: true,
      },
    });

    const clicksByDate = await prisma.adClick.groupBy({
      by: ['createdAt'],
      where: {
        advertisement: {
          businessId: businessAccount.id,
        },
        createdAt: { gte: startDate },
      },
      _count: {
        id: true,
      },
    });

    // Demographic breakdown (from impressions)
    const impressions = await prisma.adImpression.findMany({
      where: {
        advertisement: {
          businessId: businessAccount.id,
        },
        createdAt: { gte: startDate },
      },
      include: {
        user: {
          select: {
            gender: true,
            dateOfBirth: true,
            campusId: true,
          },
        },
      },
    });

    const demographics = {
      byGender: {} as Record<string, number>,
      byAgeGroup: {} as Record<string, number>,
      byCampus: {} as Record<string, number>,
    };

    impressions.forEach(imp => {
      // Gender
      const gender = imp.user?.gender || 'UNKNOWN';
      demographics.byGender[gender] = (demographics.byGender[gender] || 0) + 1;

      // Age group
      if (imp.user?.dateOfBirth) {
        const age = Math.floor(
          (now.getTime() - new Date(imp.user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        );
        const ageGroup = age < 18 ? '<18' : age < 25 ? '18-24' : age < 35 ? '25-34' : '35+';
        demographics.byAgeGroup[ageGroup] = (demographics.byAgeGroup[ageGroup] || 0) + 1;
      }

      // Campus
      if (imp.user?.campusId) {
        demographics.byCampus[imp.user.campusId] = (demographics.byCampus[imp.user.campusId] || 0) + 1;
      }
    });

    return successResponse({
      overview,
      performanceByFormat,
      topAds,
      demographics,
      timeRange,
    });
  } catch (error) {
    console.error('Get business analytics error:', error);
    return errorResponse('Failed to get analytics', ErrorCode.SERVER_ERROR, 500);
  }
});
