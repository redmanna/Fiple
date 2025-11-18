// Reward System - Milestone Tracking & Payouts
import prisma from './prisma';
import { MILESTONE_TIERS, MilestoneCriteria, RewardType, RewardStatus } from '@/../../shared/types';
import { generateTransactionRef } from './auth';
import { createNotification } from './notifications';
import { NotificationType } from '@prisma/client';

/**
 * Check if user has achieved any new milestones
 * Called after follower/like/share count updates
 */
export async function checkMilestones(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      followersCount: true,
      totalLikes: true,
      totalShares: true,
      tiersAchieved: true,
      currentTier: true,
    },
  });

  if (!user) return;

  const achievedTiers = user.tiersAchieved || [];

  for (const milestone of MILESTONE_TIERS) {
    // Skip if already achieved
    if (achievedTiers.includes(milestone.tier)) {
      continue;
    }

    // Check if milestone criteria met
    const meetsFollowers = user.followersCount >= milestone.followers;
    const meetsLikes = user.totalLikes >= milestone.likes;
    const meetsShares = user.totalShares >= milestone.shares;

    if (meetsFollowers && meetsLikes && meetsShares) {
      await awardMilestone(user.id, milestone);
    }
  }
}

/**
 * Award a milestone to a user
 */
async function awardMilestone(
  userId: string,
  milestone: MilestoneCriteria
): Promise<void> {
  const rewardTypeMap: Record<string, RewardType> = {
    Freshman: RewardType.MILESTONE_TIER_1,
    Sophomore: RewardType.MILESTONE_TIER_2,
    Junior: RewardType.MILESTONE_TIER_3,
    Senior: RewardType.MILESTONE_TIER_4,
    Alumnus: RewardType.MILESTONE_TIER_5,
  };

  const rewardType = rewardTypeMap[milestone.tier];

  // Create reward record
  const reward = await prisma.reward.create({
    data: {
      userId,
      type: rewardType,
      status: RewardStatus.PENDING,
      amount: milestone.reward,
      currency: 'NGN',
      description: `${milestone.tier} Milestone Achievement`,
      followersCount: milestone.followers,
      likesCount: milestone.likes,
      sharesCount: milestone.shares,
    },
  });

  // Update user tier
  await prisma.user.update({
    where: { id: userId },
    data: {
      currentTier: milestone.tier,
      tiersAchieved: {
        push: milestone.tier,
      },
    },
  });

  // Create notification
  await createNotification({
    userId,
    type: NotificationType.MILESTONE_ACHIEVED,
    title: `🎉 ${milestone.tier} Milestone Achieved!`,
    message: `Congratulations! You've earned ₦${milestone.reward.toLocaleString()} for reaching the ${milestone.tier} tier!`,
    data: {
      rewardId: reward.id,
      tier: milestone.tier,
      amount: milestone.reward,
    },
  });

  // Auto-verify and process payout (in production, this would go through manual approval)
  await processRewardPayout(reward.id);
}

/**
 * Process reward payout
 * In production, this would integrate with Paystack/bank transfer
 */
export async function processRewardPayout(rewardId: string): Promise<void> {
  const reward = await prisma.reward.findUnique({
    where: { id: rewardId },
    include: { user: true },
  });

  if (!reward || reward.status !== RewardStatus.PENDING) {
    return;
  }

  try {
    // Update reward status
    await prisma.reward.update({
      where: { id: rewardId },
      data: {
        status: RewardStatus.VERIFIED,
        verifiedAt: new Date(),
      },
    });

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: reward.userId,
        type: 'MILESTONE_REWARD',
        status: 'COMPLETED',
        amount: reward.amount,
        currency: reward.currency,
        fee: 0,
        netAmount: reward.amount,
        description: reward.description,
        reference: generateTransactionRef(),
        gateway: 'fiple_rewards',
        completedAt: new Date(),
      },
    });

    // Update wallet balance
    const wallet = await prisma.wallet.upsert({
      where: { userId: reward.userId },
      create: {
        userId: reward.userId,
        balanceNGN: reward.amount,
        totalEarned: reward.amount,
      },
      update: {
        balanceNGN: { increment: reward.amount },
        totalEarned: { increment: reward.amount },
      },
    });

    // Update reward with transaction
    await prisma.reward.update({
      where: { id: rewardId },
      data: {
        status: RewardStatus.DISBURSED,
        disbursedAt: new Date(),
        transactionId: transaction.id,
        paymentRef: transaction.reference,
      },
    });

    // Notify user
    await createNotification({
      userId: reward.userId,
      type: NotificationType.REWARD_DISBURSED,
      title: '💰 Reward Disbursed!',
      message: `₦${reward.amount.toLocaleString()} has been credited to your Fiple Wallet!`,
      data: {
        rewardId: reward.id,
        transactionId: transaction.id,
        amount: reward.amount,
      },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: reward.userId,
        action: 'reward_disbursement',
        entity: 'Reward',
        entityId: reward.id,
        changes: {
          amount: reward.amount,
          type: reward.type,
          status: RewardStatus.DISBURSED,
        },
      },
    });
  } catch (error) {
    // Mark reward as failed
    await prisma.reward.update({
      where: { id: rewardId },
      data: {
        status: RewardStatus.FAILED,
        failureReason: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    throw error;
  }
}

/**
 * Calculate weekly leaderboard and award prizes
 */
export async function calculateWeeklyLeaderboard(): Promise<void> {
  const now = new Date();
  const weekNumber = getWeekNumber(now);
  const year = now.getFullYear();

  // Get minimum active users threshold
  const minActiveUsers = parseInt(process.env.MIN_ACTIVE_USERS_FOR_POOL || '100000');
  const activeUsersCount = await prisma.user.count({
    where: {
      accountStatus: 'ACTIVE',
    },
  });

  if (activeUsersCount < minActiveUsers) {
    console.log(`Not enough active users (${activeUsersCount}/${minActiveUsers}). Skipping weekly rewards.`);
    return;
  }

  // Calculate engagement scores for the week
  const topCreators = await prisma.$queryRaw<any[]>`
    SELECT
      u.id as "userId",
      COUNT(DISTINCT f.id) as "newFollowers",
      SUM(p."viewsCount") as "totalViews",
      SUM(p."commentsCount") as "totalComments",
      (COUNT(DISTINCT f.id) * 0.4 + SUM(p."viewsCount") * 0.3 + SUM(p."commentsCount") * 0.3) as "engagementScore"
    FROM "User" u
    LEFT JOIN "Follow" f ON f."followingId" = u.id AND f."createdAt" >= NOW() - INTERVAL '7 days'
    LEFT JOIN "Post" p ON p."userId" = u.id AND p."publishedAt" >= NOW() - INTERVAL '7 days'
    WHERE u."accountStatus" = 'ACTIVE'
    GROUP BY u.id
    ORDER BY "engagementScore" DESC
    LIMIT 3
  `;

  if (topCreators.length === 0) {
    console.log('No creators found for weekly leaderboard');
    return;
  }

  // Prize distribution
  const totalPrizePool = parseFloat(process.env.WEEKLY_REWARD_POOL_NGN || '1000000');
  const prizes = [
    totalPrizePool * 0.5,  // 50% for 1st
    totalPrizePool * 0.3,  // 30% for 2nd
    totalPrizePool * 0.2,  // 20% for 3rd
  ];

  // Award prizes to top 3
  for (let i = 0; i < topCreators.length && i < 3; i++) {
    const creator = topCreators[i];
    const rank = i + 1;
    const prize = prizes[i];

    // Create leaderboard entry
    await prisma.weeklyLeaderboard.create({
      data: {
        userId: creator.userId,
        weekNumber,
        year,
        newFollowers: parseInt(creator.newFollowers) || 0,
        totalViews: parseInt(creator.totalViews) || 0,
        totalComments: parseInt(creator.totalComments) || 0,
        engagementScore: parseFloat(creator.engagementScore) || 0,
        rank,
        prizeAmount: prize,
        isPaid: false,
      },
    });

    // Create reward
    const reward = await prisma.reward.create({
      data: {
        userId: creator.userId,
        type: RewardType.WEEKLY_TOP_CREATOR,
        status: RewardStatus.PENDING,
        amount: prize,
        currency: 'NGN',
        description: `Weekly Top Creator - Rank #${rank}`,
        weekNumber,
        rank,
      },
    });

    // Process payout
    await processRewardPayout(reward.id);

    // Mark leaderboard entry as paid
    await prisma.weeklyLeaderboard.updateMany({
      where: { userId: creator.userId, weekNumber, year },
      data: { isPaid: true },
    });
  }
}

/**
 * Get ISO week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Get user's progress toward next milestone
 */
export async function getMilestoneProgress(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      followersCount: true,
      totalLikes: true,
      totalShares: true,
      tiersAchieved: true,
      currentTier: true,
    },
  });

  if (!user) return null;

  const achievedTiers = user.tiersAchieved || [];
  const nextTier = MILESTONE_TIERS.find(tier => !achievedTiers.includes(tier.tier));

  if (!nextTier) {
    return {
      currentTier: user.currentTier,
      nextTier: null,
      progress: null,
    };
  }

  const progress = {
    followers: {
      current: user.followersCount,
      required: nextTier.followers,
      percentage: Math.min(100, (user.followersCount / nextTier.followers) * 100),
    },
    likes: {
      current: user.totalLikes,
      required: nextTier.likes,
      percentage: Math.min(100, (user.totalLikes / nextTier.likes) * 100),
    },
    shares: {
      current: user.totalShares,
      required: nextTier.shares,
      percentage: Math.min(100, (user.totalShares / nextTier.shares) * 100),
    },
  };

  return {
    currentTier: user.currentTier,
    nextTier: nextTier.tier,
    reward: nextTier.reward,
    progress,
  };
}
