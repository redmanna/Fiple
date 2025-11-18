// Subscription Management - Creator+ Plans
import prisma from './prisma';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';

/**
 * Subscription Plans Configuration
 */
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: SubscriptionPlan.FREE,
    name: 'Free',
    price: 0,
    currency: 'NGN',
    features: {
      postsPerDay: 2,
      maxFollowers: 1000,
      analytics: false,
      verification: false,
      customBadge: false,
      noAds: false,
      priority: false,
      tipping: false,
      skillExchange: false,
    },
  },
  CREATOR_PLUS_MONTHLY: {
    id: SubscriptionPlan.CREATOR_PLUS_MONTHLY,
    name: 'Creator+ Monthly',
    price: 2000, // ₦2,000/month
    currency: 'NGN',
    interval: 'month',
    features: {
      postsPerDay: 'unlimited',
      maxFollowers: 'unlimited',
      analytics: true,
      verification: true,
      customBadge: true,
      noAds: true,
      priority: true,
      tipping: true,
      skillExchange: true,
      earlyAccess: true,
      supportPriority: true,
    },
  },
  CREATOR_PLUS_YEARLY: {
    id: SubscriptionPlan.CREATOR_PLUS_YEARLY,
    name: 'Creator+ Yearly',
    price: 20000, // ₦20,000/year (save ₦4,000)
    currency: 'NGN',
    interval: 'year',
    features: {
      postsPerDay: 'unlimited',
      maxFollowers: 'unlimited',
      analytics: true,
      verification: true,
      customBadge: true,
      noAds: true,
      priority: true,
      tipping: true,
      skillExchange: true,
      earlyAccess: true,
      supportPriority: true,
      discount: '17% off',
    },
  },
};

/**
 * Create a new subscription
 */
export async function createSubscription(
  userId: string,
  plan: SubscriptionPlan,
  paymentRef: string
) {
  const planConfig = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === plan);
  if (!planConfig) throw new Error('Invalid plan');

  const now = new Date();
  const periodEnd = new Date(now);

  if (planConfig.interval === 'month') {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else if (planConfig.interval === 'year') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  const subscription = await prisma.subscription.create({
    data: {
      userId,
      plan,
      status: SubscriptionStatus.ACTIVE,
      amount: planConfig.price,
      currency: planConfig.currency,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      // paystackSubId: paymentRef, // Set when integrated
    },
  });

  // Update user role to CREATOR if not already
  await prisma.user.update({
    where: { id: userId },
    data: {
      role: 'CREATOR',
    },
  });

  return subscription;
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  userId: string,
  subscriptionId: string
) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      id: subscriptionId,
      userId,
    },
  });

  if (!subscription) throw new Error('Subscription not found');

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      cancelAtPeriodEnd: true,
      cancelledAt: new Date(),
    },
  });

  return subscription;
}

/**
 * Check if user has active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: {
        gte: new Date(),
      },
    },
  });

  return !!subscription;
}

/**
 * Get user subscription limits
 */
export async function getUserLimits(userId: string) {
  const hasSubscription = await hasActiveSubscription(userId);

  if (hasSubscription) {
    return SUBSCRIPTION_PLANS.CREATOR_PLUS_MONTHLY.features;
  }

  return SUBSCRIPTION_PLANS.FREE.features;
}

/**
 * Check if user can perform action
 */
export async function canPerformAction(
  userId: string,
  action: 'post' | 'tip' | 'skillExchange' | 'analytics'
): Promise<boolean> {
  const limits = await getUserLimits(userId);

  switch (action) {
    case 'post':
      // Check daily post limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const postsToday = await prisma.post.count({
        where: {
          userId,
          createdAt: { gte: today },
        },
      });

      return limits.postsPerDay === 'unlimited' ||
             postsToday < (limits.postsPerDay as number);

    case 'tip':
      return !!limits.tipping;

    case 'skillExchange':
      return !!limits.skillExchange;

    case 'analytics':
      return !!limits.analytics;

    default:
      return true;
  }
}

/**
 * Renew subscription (called by webhook or cron)
 */
export async function renewSubscription(subscriptionId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) throw new Error('Subscription not found');

  const planConfig = Object.values(SUBSCRIPTION_PLANS).find(
    p => p.id === subscription.plan
  );

  if (!planConfig) throw new Error('Invalid plan');

  const now = new Date();
  const periodEnd = new Date(now);

  if (planConfig.interval === 'month') {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  } else if (planConfig.interval === 'year') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  }

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      status: SubscriptionStatus.ACTIVE,
    },
  });
}

/**
 * Handle subscription expiration
 */
export async function expireSubscriptions() {
  const now = new Date();

  const expiredSubs = await prisma.subscription.findMany({
    where: {
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEnd: {
        lt: now,
      },
      cancelAtPeriodEnd: false,
    },
  });

  for (const sub of expiredSubs) {
    // Try to renew (charge customer)
    // If payment fails, mark as expired
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: SubscriptionStatus.EXPIRED,
      },
    });

    // Optionally downgrade user to FREE
    await prisma.user.update({
      where: { id: sub.userId },
      data: {
        role: 'USER',
      },
    });
  }
}

/**
 * Get subscription analytics
 */
export async function getSubscriptionAnalytics() {
  const [totalActive, totalRevenue, planBreakdown] = await Promise.all([
    // Total active subscriptions
    prisma.subscription.count({
      where: {
        status: SubscriptionStatus.ACTIVE,
      },
    }),

    // Total monthly recurring revenue
    prisma.subscription.aggregate({
      where: {
        status: SubscriptionStatus.ACTIVE,
      },
      _sum: {
        amount: true,
      },
    }),

    // Breakdown by plan
    prisma.subscription.groupBy({
      by: ['plan'],
      where: {
        status: SubscriptionStatus.ACTIVE,
      },
      _count: true,
    }),
  ]);

  return {
    totalActive,
    monthlyRecurringRevenue: totalRevenue._sum.amount || 0,
    planBreakdown,
  };
}
