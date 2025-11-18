// Admin Analytics & Dashboard
import prisma from './prisma';

/**
 * Get comprehensive platform analytics
 */
export async function getPlatformAnalytics(timeRange: '24h' | '7d' | '30d' | 'all' = '30d') {
  const now = new Date();
  let startDate = new Date();

  switch (timeRange) {
    case '24h':
      startDate.setHours(now.getHours() - 24);
      break;
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    case 'all':
      startDate = new Date(0); // Beginning of time
      break;
  }

  const [
    totalUsers,
    activeUsers,
    newUsersToday,
    newUsersThisWeek,
    totalPosts,
    totalTransactions,
    totalRevenue,
    activeSubscriptions,
    totalRewardsPaid,
    verifiedUsers,
    campusHubs,
    topCreators,
  ] = await Promise.all([
    // Total users
    prisma.user.count(),

    // Active users (posted/liked in timeframe)
    prisma.user.count({
      where: {
        lastActiveAt: { gte: startDate },
      },
    }),

    // New users today
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(now.setHours(0, 0, 0, 0)),
        },
      },
    }),

    // New users this week
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(now.setDate(now.getDate() - 7)),
        },
      },
    }),

    // Total posts
    prisma.post.count({
      where: {
        publishedAt: { gte: startDate },
      },
    }),

    // Total transactions
    prisma.transaction.count({
      where: {
        createdAt: { gte: startDate },
      },
    }),

    // Total revenue (subscriptions + fees)
    prisma.transaction.aggregate({
      where: {
        createdAt: { gte: startDate },
        status: 'COMPLETED',
        type: { in: ['DEPOSIT', 'POINTS_PURCHASE'] },
      },
      _sum: { amount: true },
    }),

    // Active subscriptions
    prisma.subscription.count({
      where: {
        status: 'ACTIVE',
      },
    }),

    // Total rewards paid
    prisma.reward.aggregate({
      where: {
        status: 'DISBURSED',
        disbursedAt: { gte: startDate },
      },
      _sum: { amount: true },
    }),

    // Verified users
    prisma.user.count({
      where: {
        verificationStatus: 'VERIFIED',
      },
    }),

    // Campus hubs
    prisma.campusHub.count(),

    // Top creators by engagement
    prisma.user.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      orderBy: {
        engagementScore: 'desc',
      },
      take: 10,
      select: {
        id: true,
        displayName: true,
        username: true,
        followersCount: true,
        postsCount: true,
        totalLikes: true,
        engagementScore: true,
        currentTier: true,
      },
    }),
  ]);

  return {
    overview: {
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
      totalPosts,
      totalTransactions,
      totalRevenue: totalRevenue._sum.amount || 0,
      activeSubscriptions,
      totalRewardsPaid: totalRewardsPaid._sum.amount || 0,
      verifiedUsers,
      campusHubs,
    },
    topCreators,
  };
}

/**
 * Get user growth analytics
 */
export async function getUserGrowthAnalytics(days: number = 30) {
  const growthData = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const [newUsers, activeUsers] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      }),

      prisma.user.count({
        where: {
          lastActiveAt: {
            gte: date,
            lt: nextDate,
          },
        },
      }),
    ]);

    growthData.push({
      date: date.toISOString().split('T')[0],
      newUsers,
      activeUsers,
    });
  }

  return growthData;
}

/**
 * Get content analytics
 */
export async function getContentAnalytics() {
  const [
    postsByType,
    topPosts,
    flaggedContent,
    trendingHashtags,
  ] = await Promise.all([
    // Posts by content type
    prisma.post.groupBy({
      by: ['contentType'],
      _count: true,
      where: {
        publishedAt: { not: null },
      },
    }),

    // Top posts by engagement
    prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
      },
      orderBy: {
        totalScore: 'desc',
      },
      take: 20,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatar: true,
          },
        },
      },
    }),

    // Flagged content
    prisma.post.count({
      where: {
        isFlagged: true,
      },
    }),

    // Trending hashtags (simplified)
    prisma.$queryRaw`
      SELECT
        unnest(hashtags) as hashtag,
        COUNT(*) as count
      FROM "Post"
      WHERE "publishedAt" >= NOW() - INTERVAL '7 days'
      GROUP BY hashtag
      ORDER BY count DESC
      LIMIT 20
    `,
  ]);

  return {
    postsByType,
    topPosts,
    flaggedContent,
    trendingHashtags,
  };
}

/**
 * Get financial analytics
 */
export async function getFinancialAnalytics(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [
    revenueByDay,
    rewardsByDay,
    subscriptionRevenue,
    withdrawals,
    pendingWithdrawals,
  ] = await Promise.all([
    // Revenue by day
    prisma.$queryRaw`
      SELECT
        DATE("createdAt") as date,
        SUM(amount) as revenue
      FROM "Transaction"
      WHERE "createdAt" >= ${startDate}
        AND status = 'COMPLETED'
        AND type IN ('DEPOSIT', 'POINTS_PURCHASE')
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `,

    // Rewards paid by day
    prisma.$queryRaw`
      SELECT
        DATE("disbursedAt") as date,
        SUM(amount) as amount,
        COUNT(*) as count
      FROM "Reward"
      WHERE "disbursedAt" >= ${startDate}
        AND status = 'DISBURSED'
      GROUP BY DATE("disbursedAt")
      ORDER BY date ASC
    `,

    // Subscription revenue
    prisma.subscription.aggregate({
      where: {
        status: 'ACTIVE',
      },
      _sum: {
        amount: true,
      },
      _count: true,
    }),

    // Total withdrawals
    prisma.transaction.aggregate({
      where: {
        type: 'WITHDRAWAL',
        status: 'COMPLETED',
        createdAt: { gte: startDate },
      },
      _sum: {
        amount: true,
      },
    }),

    // Pending withdrawals
    prisma.transaction.findMany({
      where: {
        type: 'WITHDRAWAL',
        status: { in: ['PENDING', 'PROCESSING'] },
      },
      include: {
        user: {
          select: {
            displayName: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return {
    revenueByDay,
    rewardsByDay,
    subscriptionRevenue: {
      total: subscriptionRevenue._sum.amount || 0,
      count: subscriptionRevenue._count,
    },
    withdrawals: withdrawals._sum.amount || 0,
    pendingWithdrawals,
  };
}

/**
 * Get reward system analytics
 */
export async function getRewardAnalytics() {
  const [
    rewardsByTier,
    totalDisbursed,
    pendingRewards,
    weeklyLeaderboard,
    topEarners,
  ] = await Promise.all([
    // Rewards by tier
    prisma.reward.groupBy({
      by: ['type'],
      where: {
        status: 'DISBURSED',
      },
      _count: true,
      _sum: {
        amount: true,
      },
    }),

    // Total disbursed
    prisma.reward.aggregate({
      where: {
        status: 'DISBURSED',
      },
      _sum: {
        amount: true,
      },
    }),

    // Pending rewards
    prisma.reward.findMany({
      where: {
        status: { in: ['PENDING', 'VERIFIED', 'APPROVED'] },
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    }),

    // Current week leaderboard
    prisma.weeklyLeaderboard.findMany({
      where: {
        weekNumber: getWeekNumber(new Date()),
        year: new Date().getFullYear(),
      },
      orderBy: {
        rank: 'asc',
      },
      take: 10,
      include: {
        user: true,
      },
    }),

    // Top earners all time
    prisma.user.findMany({
      orderBy: {
        wallet: {
          totalEarned: 'desc',
        },
      },
      take: 20,
      select: {
        id: true,
        displayName: true,
        username: true,
        currentTier: true,
        wallet: {
          select: {
            totalEarned: true,
          },
        },
      },
    }),
  ]);

  return {
    rewardsByTier,
    totalDisbursed: totalDisbursed._sum.amount || 0,
    pendingRewards,
    weeklyLeaderboard,
    topEarners,
  };
}

/**
 * Get moderation queue
 */
export async function getModerationQueue() {
  const [
    flaggedPosts,
    reportedUsers,
    suspendedUsers,
    pendingVerifications,
  ] = await Promise.all([
    // Flagged posts
    prisma.post.findMany({
      where: {
        isFlagged: true,
        status: 'FLAGGED',
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    }),

    // Reported users (would need Report model)
    [],

    // Suspended users
    prisma.user.findMany({
      where: {
        accountStatus: 'SUSPENDED',
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        createdAt: true,
      },
      take: 50,
    }),

    // Pending campus verifications
    prisma.user.findMany({
      where: {
        verificationStatus: 'PENDING',
        campusId: { not: null },
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        campusName: true,
        schoolEmail: true,
        createdAt: true,
      },
      take: 50,
    }),
  ]);

  return {
    flaggedPosts,
    reportedUsers,
    suspendedUsers,
    pendingVerifications,
  };
}

/**
 * Get system health metrics
 */
export async function getSystemHealth() {
  const [
    databaseSize,
    averageResponseTime,
    errorRate,
  ] = await Promise.all([
    // Database size (PostgreSQL specific)
    prisma.$queryRaw`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `,

    // Average API response time (would need request logging)
    { avgTime: 0 },

    // Error rate (would need error tracking)
    { rate: 0 },
  ]);

  return {
    databaseSize,
    averageResponseTime,
    errorRate,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  };
}

/**
 * Helper function to get week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Export analytics data (CSV format)
 */
export async function exportAnalyticsCSV(type: 'users' | 'posts' | 'transactions' | 'rewards') {
  let data: any[] = [];
  let headers: string[] = [];

  switch (type) {
    case 'users':
      data = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          followersCount: true,
          postsCount: true,
          currentTier: true,
          createdAt: true,
        },
      });
      headers = ['id', 'email', 'username', 'displayName', 'followersCount', 'postsCount', 'currentTier', 'createdAt'];
      break;

    case 'posts':
      data = await prisma.post.findMany({
        select: {
          id: true,
          userId: true,
          contentType: true,
          likesCount: true,
          commentsCount: true,
          sharesCount: true,
          viewsCount: true,
          createdAt: true,
        },
      });
      headers = ['id', 'userId', 'contentType', 'likesCount', 'commentsCount', 'sharesCount', 'viewsCount', 'createdAt'];
      break;

    case 'transactions':
      data = await prisma.transaction.findMany({
        select: {
          id: true,
          userId: true,
          type: true,
          amount: true,
          status: true,
          reference: true,
          createdAt: true,
        },
      });
      headers = ['id', 'userId', 'type', 'amount', 'status', 'reference', 'createdAt'];
      break;

    case 'rewards':
      data = await prisma.reward.findMany({
        select: {
          id: true,
          userId: true,
          type: true,
          amount: true,
          status: true,
          createdAt: true,
          disbursedAt: true,
        },
      });
      headers = ['id', 'userId', 'type', 'amount', 'status', 'createdAt', 'disbursedAt'];
      break;
  }

  // Convert to CSV
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const value = (row as any)[header];
      return typeof value === 'string' ? `"${value}"` : value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}
