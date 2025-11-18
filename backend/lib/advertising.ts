// Advertising System - Ad Serving, Targeting & Analytics
import prisma from './prisma';

/**
 * Ad Targeting Options Interface
 */
export interface AdTargeting {
  // Demographics
  ageMin?: number;
  ageMax?: number;
  gender?: 'ALL' | 'MALE' | 'FEMALE' | 'NON_BINARY';

  // Location
  countries?: string[];
  states?: string[];
  cities?: string[];

  // Campus Targeting
  campusHubs?: string[];     // Specific universities
  campusOnly?: boolean;      // Only target students

  // Interests
  interests?: string[];      // fashion, tech, food, etc.

  // Behaviors
  activeUsers?: boolean;     // Daily active users
  creators?: boolean;        // Content creators
  premiumUsers?: boolean;    // Paid subscribers

  // Engagement
  minFollowers?: number;
  highEngagement?: boolean;  // Users with >5% engagement rate

  // Device
  platforms?: ('ios' | 'android' | 'web')[];

  // Custom
  customAudience?: string[]; // User IDs
}

/**
 * Get eligible ads for a user
 */
export async function getAdsForUser(userId: string, placement: string, limit: number = 1) {
  // Get user profile for targeting
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      dateOfBirth: true,
      gender: true,
      city: true,
      state: true,
      country: true,
      campusId: true,
      followersCount: true,
      engagementScore: true,
      role: true,
    },
  });

  if (!user) return [];

  // Calculate age
  const age = user.dateOfBirth
    ? Math.floor((Date.now() - user.dateOfBirth.getTime()) / (1000 * 60 * 60 * 24 * 365))
    : null;

  // Get active ads
  const now = new Date();
  const activeAds = await prisma.advertisement.findMany({
    where: {
      status: 'ACTIVE',
      startDate: { lte: now },
      OR: [
        { endDate: null },
        { endDate: { gte: now } },
      ],
      totalSpent: { lt: prisma.raw('total_budget') },
    },
    include: {
      business: {
        select: {
          businessName: true,
          isVerified: true,
        },
      },
    },
  });

  // Filter ads based on targeting
  const eligibleAds = activeAds.filter(ad => {
    const targeting = ad.targeting as AdTargeting;

    // Age targeting
    if (age !== null) {
      if (targeting.ageMin && age < targeting.ageMin) return false;
      if (targeting.ageMax && age > targeting.ageMax) return false;
    }

    // Gender targeting
    if (targeting.gender && targeting.gender !== 'ALL') {
      if (user.gender?.toUpperCase() !== targeting.gender) return false;
    }

    // Location targeting
    if (targeting.cities && targeting.cities.length > 0) {
      if (!user.city || !targeting.cities.includes(user.city)) return false;
    }

    if (targeting.states && targeting.states.length > 0) {
      if (!user.state || !targeting.states.includes(user.state)) return false;
    }

    if (targeting.countries && targeting.countries.length > 0) {
      if (!targeting.countries.includes(user.country)) return false;
    }

    // Campus targeting
    if (targeting.campusHubs && targeting.campusHubs.length > 0) {
      if (!user.campusId || !targeting.campusHubs.includes(user.campusId)) return false;
    }

    if (targeting.campusOnly && !user.campusId) return false;

    // Behavior targeting
    if (targeting.activeUsers) {
      // Check if user was active in last 24 hours (would need lastActiveAt field)
    }

    if (targeting.creators && user.role !== 'CREATOR') return false;

    if (targeting.premiumUsers && user.role === 'USER') return false;

    // Engagement targeting
    if (targeting.minFollowers && user.followersCount < targeting.minFollowers) return false;

    if (targeting.highEngagement && user.engagementScore < 5.0) return false;

    // Custom audience
    if (targeting.customAudience && targeting.customAudience.length > 0) {
      if (!targeting.customAudience.includes(userId)) return false;
    }

    // Budget check
    if (ad.dailyBudget) {
      // Check daily spend (would need daily tracking)
    }

    return true;
  });

  // Sort by bid amount (higher bids first)
  eligibleAds.sort((a, b) => {
    const aBid = a.bidAmount || 0;
    const bBid = b.bidAmount || 0;
    return bBid - aBid;
  });

  // Return top ads
  return eligibleAds.slice(0, limit);
}

/**
 * Record ad impression
 */
export async function recordAdImpression(params: {
  adId: string;
  userId?: string;
  platform: string;
  placement: string;
  sessionId?: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  // Create impression log
  await prisma.adImpression.create({
    data: {
      adId: params.adId,
      userId: params.userId,
      platform: params.platform,
      placement: params.placement,
      sessionId: params.sessionId,
      deviceId: params.deviceId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });

  // Update ad metrics
  const ad = await prisma.advertisement.findUnique({
    where: { id: params.adId },
    select: { impressions: true, pricingModel: true, bidAmount: true, totalBudget: true },
  });

  if (ad) {
    const newImpressions = ad.impressions + 1;

    // Calculate cost (if CPM model)
    let cost = 0;
    if (ad.pricingModel === 'CPM' && ad.bidAmount) {
      cost = ad.bidAmount / 1000; // Cost per 1 impression
    }

    await prisma.advertisement.update({
      where: { id: params.adId },
      data: {
        impressions: newImpressions,
        totalSpent: { increment: cost },
      },
    });
  }
}

/**
 * Record ad click
 */
export async function recordAdClick(params: {
  adId: string;
  userId?: string;
  platform: string;
  placement: string;
  sessionId?: string;
  deviceId?: string;
  ipAddress?: string;
  referrer?: string;
}) {
  // Create click log
  await prisma.adClick.create({
    data: {
      adId: params.adId,
      userId: params.userId,
      platform: params.platform,
      placement: params.placement,
      sessionId: params.sessionId,
      deviceId: params.deviceId,
      ipAddress: params.ipAddress,
      referrer: params.referrer,
    },
  });

  // Update ad metrics
  const ad = await prisma.advertisement.findUnique({
    where: { id: params.adId },
    select: { clicks: true, impressions: true, pricingModel: true, bidAmount: true },
  });

  if (ad) {
    const newClicks = ad.clicks + 1;
    const ctr = ad.impressions > 0 ? (newClicks / ad.impressions) * 100 : 0;

    // Calculate cost (if CPC model)
    let cost = 0;
    if (ad.pricingModel === 'CPC' && ad.bidAmount) {
      cost = ad.bidAmount;
    }

    await prisma.advertisement.update({
      where: { id: params.adId },
      data: {
        clicks: newClicks,
        ctr,
        totalSpent: { increment: cost },
      },
    });
  }
}

/**
 * Record ad conversion
 */
export async function recordAdConversion(
  adId: string,
  userId: string,
  conversionType: string
) {
  // Find click within last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const click = await prisma.adClick.findFirst({
    where: {
      adId,
      userId,
      createdAt: { gte: thirtyDaysAgo },
      converted: false,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (click) {
    // Mark click as converted
    await prisma.adClick.update({
      where: { id: click.id },
      data: {
        converted: true,
        conversionType,
      },
    });

    // Update ad metrics
    const ad = await prisma.advertisement.findUnique({
      where: { id: adId },
      select: { conversions: true, clicks: true, pricingModel: true, bidAmount: true },
    });

    if (ad) {
      const newConversions = ad.conversions + 1;
      const conversionRate = ad.clicks > 0 ? (newConversions / ad.clicks) * 100 : 0;

      // Calculate cost (if CPA model)
      let cost = 0;
      if (ad.pricingModel === 'CPA' && ad.bidAmount) {
        cost = ad.bidAmount;
      }

      await prisma.advertisement.update({
        where: { id: adId },
        data: {
          conversions: newConversions,
          conversionRate,
          totalSpent: { increment: cost },
        },
      });
    }
  }
}

/**
 * Get ad performance analytics
 */
export async function getAdAnalytics(adId: string, dateRange?: { start: Date; end: Date }) {
  const ad = await prisma.advertisement.findUnique({
    where: { id: adId },
    include: {
      business: {
        select: {
          businessName: true,
        },
      },
    },
  });

  if (!ad) throw new Error('Ad not found');

  // Get time-series data
  const where: any = { adId };
  if (dateRange) {
    where.createdAt = {
      gte: dateRange.start,
      lte: dateRange.end,
    };
  }

  const [impressionLogs, clickLogs] = await Promise.all([
    prisma.adImpression.findMany({ where }),
    prisma.adClick.findMany({ where }),
  ]);

  // Demographics breakdown
  const impressionsByGender: Record<string, number> = {};
  const impressionsByAge: Record<string, number> = {};
  const impressionsByLocation: Record<string, number> = {};
  const impressionsByPlatform: Record<string, number> = {};

  for (const impression of impressionLogs) {
    // Platform
    impressionsByPlatform[impression.platform] =
      (impressionsByPlatform[impression.platform] || 0) + 1;

    if (impression.userId) {
      // Get user demographics
      const user = await prisma.user.findUnique({
        where: { id: impression.userId },
        select: { gender: true, dateOfBirth: true, city: true },
      });

      if (user) {
        // Gender
        if (user.gender) {
          impressionsByGender[user.gender] =
            (impressionsByGender[user.gender] || 0) + 1;
        }

        // Age group
        if (user.dateOfBirth) {
          const age = Math.floor(
            (Date.now() - user.dateOfBirth.getTime()) / (1000 * 60 * 60 * 24 * 365)
          );
          const ageGroup = getAgeGroup(age);
          impressionsByAge[ageGroup] = (impressionsByAge[ageGroup] || 0) + 1;
        }

        // Location
        if (user.city) {
          impressionsByLocation[user.city] =
            (impressionsByLocation[user.city] || 0) + 1;
        }
      }
    }
  }

  // Calculate metrics
  const totalImpressions = impressionLogs.length;
  const totalClicks = clickLogs.length;
  const totalConversions = clickLogs.filter(c => c.converted).length;

  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  const cpm = totalImpressions > 0 ? (ad.totalSpent / totalImpressions) * 1000 : 0;
  const cpc = totalClicks > 0 ? ad.totalSpent / totalClicks : 0;
  const cpa = totalConversions > 0 ? ad.totalSpent / totalConversions : 0;

  return {
    ad: {
      id: ad.id,
      name: ad.name,
      format: ad.format,
      status: ad.status,
      businessName: ad.business.businessName,
    },
    overview: {
      impressions: totalImpressions,
      clicks: totalClicks,
      conversions: totalConversions,
      reach: ad.reach,
      engagement: ad.engagement,
      spent: ad.totalSpent,
      budget: ad.totalBudget,
      remaining: ad.totalBudget - ad.totalSpent,
    },
    performance: {
      ctr,
      conversionRate,
      cpm,
      cpc,
      cpa,
    },
    demographics: {
      gender: impressionsByGender,
      age: impressionsByAge,
      location: impressionsByLocation,
      platform: impressionsByPlatform,
    },
    timeline: await getAdTimelineData(adId, dateRange),
  };
}

/**
 * Get ad timeline data (daily breakdown)
 */
async function getAdTimelineData(adId: string, dateRange?: { start: Date; end: Date }) {
  const summaries = await prisma.adAnalyticsSummary.findMany({
    where: {
      adId,
      ...(dateRange && {
        date: {
          gte: dateRange.start,
          lte: dateRange.end,
        },
      }),
    },
    orderBy: { date: 'asc' },
  });

  return summaries.map(s => ({
    date: s.date,
    impressions: s.impressions,
    clicks: s.clicks,
    conversions: s.conversions,
    spent: s.spent,
    ctr: s.ctr,
    cpm: s.cpm,
    cpc: s.cpc,
  }));
}

/**
 * Generate daily analytics summaries (run via cron)
 */
export async function generateDailyAdSummaries() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const today = new Date(yesterday);
  today.setDate(today.getDate() + 1);

  // Get all active ads
  const ads = await prisma.advertisement.findMany({
    where: {
      status: 'ACTIVE',
      startDate: { lte: today },
    },
    select: { id: true },
  });

  for (const ad of ads) {
    // Count impressions
    const impressions = await prisma.adImpression.count({
      where: {
        adId: ad.id,
        createdAt: {
          gte: yesterday,
          lt: today,
        },
      },
    });

    // Count clicks
    const clicks = await prisma.adClick.count({
      where: {
        adId: ad.id,
        createdAt: {
          gte: yesterday,
          lt: today,
        },
      },
    });

    // Count conversions
    const conversions = await prisma.adClick.count({
      where: {
        adId: ad.id,
        createdAt: {
          gte: yesterday,
          lt: today,
        },
        converted: true,
      },
    });

    // Calculate metrics
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

    // Get current ad data for cost calculation
    const adData = await prisma.advertisement.findUnique({
      where: { id: ad.id },
      select: { pricingModel: true, bidAmount: true },
    });

    let spent = 0;
    if (adData) {
      if (adData.pricingModel === 'CPM' && adData.bidAmount) {
        spent = (impressions / 1000) * adData.bidAmount;
      } else if (adData.pricingModel === 'CPC' && adData.bidAmount) {
        spent = clicks * adData.bidAmount;
      } else if (adData.pricingModel === 'CPA' && adData.bidAmount) {
        spent = conversions * adData.bidAmount;
      }
    }

    const cpm = impressions > 0 ? (spent / impressions) * 1000 : 0;
    const cpc = clicks > 0 ? spent / clicks : 0;

    // Create or update summary
    await prisma.adAnalyticsSummary.upsert({
      where: {
        adId_date: {
          adId: ad.id,
          date: yesterday,
        },
      },
      create: {
        adId: ad.id,
        date: yesterday,
        impressions,
        clicks,
        conversions,
        spent,
        ctr,
        cpm,
        cpc,
      },
      update: {
        impressions,
        clicks,
        conversions,
        spent,
        ctr,
        cpm,
        cpc,
      },
    });
  }

  console.log(`Generated ad summaries for ${ads.length} ads`);
}

/**
 * Helper: Get age group
 */
function getAgeGroup(age: number): string {
  if (age < 18) return '13-17';
  if (age < 25) return '18-24';
  if (age < 35) return '25-34';
  if (age < 45) return '35-44';
  if (age < 55) return '45-54';
  return '55+';
}

/**
 * Validate ad budget and pause if depleted
 */
export async function checkAndPauseDepletedAds() {
  const ads = await prisma.advertisement.findMany({
    where: {
      status: 'ACTIVE',
      totalSpent: {
        gte: prisma.raw('total_budget'),
      },
    },
  });

  for (const ad of ads) {
    await prisma.advertisement.update({
      where: { id: ad.id },
      data: { status: 'COMPLETED' },
    });

    console.log(`Ad ${ad.id} completed - budget depleted`);
  }
}

/**
 * Get ad recommendations for business
 */
export async function getAdRecommendations(businessId: string) {
  const business = await prisma.businessAccount.findUnique({
    where: { id: businessId },
    include: {
      ads: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!business) throw new Error('Business not found');

  // Analyze past performance
  const topPerformingAds = business.ads
    .filter(ad => ad.ctr > 0)
    .sort((a, b) => b.ctr - a.ctr)
    .slice(0, 3);

  // Extract common patterns
  const recommendations = {
    bestFormat: getMostCommonFormat(topPerformingAds),
    bestTimeToPost: 'Weekdays 6-9 PM', // Would analyze actual data
    budgetRecommendation: calculateOptimalBudget(business.ads),
    targetingRecommendation: extractBestTargeting(topPerformingAds),
  };

  return recommendations;
}

function getMostCommonFormat(ads: any[]) {
  if (ads.length === 0) return 'NATIVE_POST';

  const formatCounts: Record<string, number> = {};
  ads.forEach(ad => {
    formatCounts[ad.format] = (formatCounts[ad.format] || 0) + 1;
  });

  return Object.entries(formatCounts).sort((a, b) => b[1] - a[1])[0][0];
}

function calculateOptimalBudget(ads: any[]) {
  if (ads.length === 0) return { daily: 5000, total: 50000 };

  const avgSpent = ads.reduce((sum, ad) => sum + ad.totalSpent, 0) / ads.length;
  return {
    daily: Math.round(avgSpent / 7),
    total: Math.round(avgSpent),
  };
}

function extractBestTargeting(ads: any[]) {
  // Would analyze targeting from best performing ads
  return {
    ageRange: '18-34',
    locations: ['Lagos', 'Abuja'],
    interests: ['Fashion', 'Technology'],
  };
}
