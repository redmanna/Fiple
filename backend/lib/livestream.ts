// Live Streaming System - Memory-efficient with highlights only
import prisma from './prisma';
import { generateUniqueId } from './auth';

/**
 * Create a new live stream
 */
export async function createLiveStream(
  hostId: string,
  title: string,
  description?: string,
  scheduledAt?: Date,
  subscribersOnly: boolean = false
) {
  // Check if host has 5K+ followers for subscribers-only streams
  if (subscribersOnly) {
    const host = await prisma.user.findUnique({
      where: { id: hostId },
      select: { followersCount: true },
    });

    if (!host || host.followersCount < 5000) {
      throw new Error('You need 5,000+ followers to create subscribers-only streams');
    }
  }

  // Generate unique stream key for RTMP/WebRTC
  const streamKey = generateUniqueId('stream');
  const streamUrl = `${process.env.STREAM_CDN_URL}/${streamKey}`;

  const stream = await prisma.liveStream.create({
    data: {
      hostId,
      title,
      description,
      streamKey,
      streamUrl,
      scheduledAt,
      subscribersOnly,
      status: scheduledAt ? 'SCHEDULED' : 'LIVE',
      startedAt: scheduledAt ? null : new Date(),
      // Auto-delete full recording after 24 hours (memory-efficient)
      recordingDeleteAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  return stream;
}

/**
 * Start live stream (update status)
 */
export async function startLiveStream(streamId: string, hostId: string) {
  const stream = await prisma.liveStream.findFirst({
    where: {
      id: streamId,
      hostId,
    },
  });

  if (!stream) {
    throw new Error('Stream not found');
  }

  return prisma.liveStream.update({
    where: { id: streamId },
    data: {
      status: 'LIVE',
      startedAt: new Date(),
    },
  });
}

/**
 * End live stream
 */
export async function endLiveStream(streamId: string, hostId: string) {
  const stream = await prisma.liveStream.findFirst({
    where: {
      id: streamId,
      hostId,
    },
  });

  if (!stream) {
    throw new Error('Stream not found');
  }

  return prisma.liveStream.update({
    where: { id: streamId },
    data: {
      status: 'ENDED',
      endedAt: new Date(),
      currentViewers: 0,
    },
  });
}

/**
 * Join live stream as viewer
 */
export async function joinLiveStream(
  streamId: string,
  userId?: string,
  username?: string,
  displayName?: string,
  avatar?: string
) {
  const stream = await prisma.liveStream.findUnique({
    where: { id: streamId },
  });

  if (!stream || stream.status !== 'LIVE') {
    throw new Error('Stream is not live');
  }

  // Check if subscribers-only
  if (stream.subscribersOnly && userId) {
    const subscription = await prisma.liveSubscription.findFirst({
      where: {
        hostId: stream.hostId,
        subscriberId: userId,
        status: 'ACTIVE',
      },
    });

    if (!subscription) {
      throw new Error('This stream is for subscribers only');
    }
  }

  // Create or update viewer record
  let viewer;
  if (userId) {
    viewer = await prisma.liveViewer.upsert({
      where: {
        streamId_userId: {
          streamId,
          userId,
        },
      },
      create: {
        streamId,
        userId,
        username,
        displayName,
        avatar,
        joinedAt: new Date(),
      },
      update: {
        leftAt: null,
        joinedAt: new Date(),
      },
    });
  } else {
    // Anonymous viewer
    viewer = await prisma.liveViewer.create({
      data: {
        streamId,
        username: username || 'Guest',
        displayName: displayName || 'Guest',
        joinedAt: new Date(),
      },
    });
  }

  // Update stream metrics
  const currentViewers = await prisma.liveViewer.count({
    where: {
      streamId,
      leftAt: null,
    },
  });

  await prisma.liveStream.update({
    where: { id: streamId },
    data: {
      currentViewers,
      totalViewers: { increment: 1 },
      peakViewers: Math.max(stream.peakViewers, currentViewers),
    },
  });

  return viewer;
}

/**
 * Leave live stream
 */
export async function leaveLiveStream(viewerId: string, watchDuration: number) {
  await prisma.liveViewer.update({
    where: { id: viewerId },
    data: {
      leftAt: new Date(),
      watchDuration,
    },
  });

  // Update current viewers count
  const viewer = await prisma.liveViewer.findUnique({
    where: { id: viewerId },
    select: { streamId: true },
  });

  if (viewer) {
    const currentViewers = await prisma.liveViewer.count({
      where: {
        streamId: viewer.streamId,
        leftAt: null,
      },
    });

    await prisma.liveStream.update({
      where: { id: viewer.streamId },
      data: { currentViewers },
    });
  }
}

/**
 * Send gift during live stream
 */
export async function sendLiveGift(
  streamId: string,
  senderId: string,
  giftType: string,
  quantity: number = 1,
  message?: string
) {
  const stream = await prisma.liveStream.findUnique({
    where: { id: streamId },
  });

  if (!stream || stream.status !== 'LIVE') {
    throw new Error('Stream is not live');
  }

  // Gift pricing
  const giftPrices: Record<string, number> = {
    ROSE: 50,
    HEART: 100,
    STAR: 200,
    DIAMOND: 500,
    CROWN: 1000,
    ROCKET: 2000,
    FERRARI: 5000,
    MANSION: 10000,
  };

  const amount = (giftPrices[giftType] || 0) * quantity;

  // Effect level based on gift value
  let effectLevel = 1;
  if (amount >= 2000) effectLevel = 3;
  else if (amount >= 500) effectLevel = 2;

  // Create gift record
  const gift = await prisma.liveGift.create({
    data: {
      streamId,
      senderId,
      recipientId: stream.hostId,
      giftType: giftType as any,
      amount,
      quantity,
      effectLevel,
      message,
    },
  });

  // Update stream metrics
  await prisma.liveStream.update({
    where: { id: streamId },
    data: {
      totalGifts: { increment: quantity },
      totalRevenue: { increment: amount },
    },
  });

  // Update viewer stats and ranking
  await updateViewerStats(streamId, senderId, {
    giftsCount: quantity,
    giftsValue: amount,
  });

  // Add to host's wallet
  const hostShare = amount * 0.7; // 70% to host, 30% platform fee
  await prisma.wallet.update({
    where: { userId: stream.hostId },
    data: {
      balanceNGN: { increment: hostShare },
      totalEarned: { increment: hostShare },
    },
  });

  // Update gifter level
  await updateGifterLevel(senderId, stream.hostId, quantity, amount);

  return gift;
}

/**
 * Update viewer stats and calculate ranking
 */
async function updateViewerStats(
  streamId: string,
  userId: string,
  updates: { commentsCount?: number; giftsCount?: number; giftsValue?: number }
) {
  const viewer = await prisma.liveViewer.findUnique({
    where: {
      streamId_userId: {
        streamId,
        userId,
      },
    },
  });

  if (!viewer) return;

  // Update stats
  await prisma.liveViewer.update({
    where: { id: viewer.id },
    data: {
      commentsCount: { increment: updates.commentsCount || 0 },
      giftsCount: { increment: updates.giftsCount || 0 },
      giftsValue: { increment: updates.giftsValue || 0 },
    },
  });

  // Calculate engagement score and update ranking
  await calculateViewerRankings(streamId);
}

/**
 * Calculate viewer rankings based on engagement
 */
export async function calculateViewerRankings(streamId: string) {
  const viewers = await prisma.liveViewer.findMany({
    where: { streamId },
  });

  // Calculate engagement scores
  const viewersWithScores = viewers.map(viewer => ({
    id: viewer.id,
    engagementScore:
      viewer.giftsValue * 10 +        // Gifts heavily weighted
      viewer.commentsCount * 2 +      // Comments
      viewer.watchDuration / 60,       // Watch time (minutes)
  }));

  // Sort by score
  viewersWithScores.sort((a, b) => b.engagementScore - a.engagementScore);

  // Update rankings and assign badges
  for (let i = 0; i < viewersWithScores.length; i++) {
    const { id, engagementScore } = viewersWithScores[i];
    const rank = i + 1;

    const badges: string[] = [];

    // Top gifter badges
    const viewer = viewers.find(v => v.id === id)!;
    if (viewer.giftsCount >= 50) badges.push('TOP_GIFTER_GOLD');
    else if (viewer.giftsCount >= 20) badges.push('TOP_GIFTER_SILVER');
    else if (viewer.giftsCount >= 5) badges.push('TOP_GIFTER_BRONZE');

    // First viewer badge
    if (rank === 1 && viewer.joinedAt) badges.push('FIRST_VIEWER');

    await prisma.liveViewer.update({
      where: { id },
      data: {
        engagementScore,
        rank,
        badges,
      },
    });
  }
}

/**
 * Update gifter level and badges
 */
async function updateGifterLevel(userId: string, hostId: string, giftsCount: number, amount: number) {
  const level = await prisma.gifterLevel.upsert({
    where: {
      userId_hostId: {
        userId,
        hostId,
      },
    },
    create: {
      userId,
      hostId,
      totalGifts: giftsCount,
      totalSpent: amount,
      currentXP: giftsCount * 10,
      streamsAttended: 1,
    },
    update: {
      totalGifts: { increment: giftsCount },
      totalSpent: { increment: amount },
      currentXP: { increment: giftsCount * 10 },
    },
  });

  // Level up logic
  if (level.currentXP >= level.nextLevelXP) {
    const newLevel = level.currentLevel + 1;
    const newNextLevelXP = level.nextLevelXP * 2;

    await prisma.gifterLevel.update({
      where: { id: level.id },
      data: {
        currentLevel: newLevel,
        nextLevelXP: newNextLevelXP,
        // Unlock benefits
        priorityChat: newLevel >= 5,
      },
    });

    // Award badge
    if (level.totalSpent >= 50000) {
      await prisma.userBadge.create({
        data: {
          userId,
          hostId,
          badgeType: 'SUPER_FAN',
        },
      });
    }
  }

  return level;
}

/**
 * Post comment in live stream
 */
export async function postLiveComment(
  streamId: string,
  userId: string,
  username: string,
  content: string
) {
  const comment = await prisma.liveComment.create({
    data: {
      streamId,
      userId,
      username,
      content,
    },
  });

  // Update stream metrics
  await prisma.liveStream.update({
    where: { id: streamId },
    data: {
      totalComments: { increment: 1 },
    },
  });

  // Update viewer stats
  await updateViewerStats(streamId, userId, { commentsCount: 1 });

  return comment;
}

/**
 * Create highlight from stream (memory-efficient)
 */
export async function createLiveHighlight(
  streamId: string,
  timestamp: number,
  duration: number,
  videoUrl: string,
  title?: string,
  reason?: string
) {
  const highlight = await prisma.liveHighlight.create({
    data: {
      streamId,
      timestamp,
      duration,
      videoUrl,
      title,
      reason,
      isAutoGenerated: !!reason,
    },
  });

  // Update stream highlight count
  await prisma.liveStream.update({
    where: { id: streamId },
    data: {
      highlightCount: { increment: 1 },
      highlightUrls: { push: videoUrl },
    },
  });

  return highlight;
}

/**
 * Subscribe to creator's live streams
 */
export async function subscribeToCreator(
  subscriberId: string,
  hostId: string,
  tier: 'BASIC' | 'PREMIUM' | 'VIP'
) {
  // Check if host has 5K+ followers
  const host = await prisma.user.findUnique({
    where: { id: hostId },
    select: { followersCount: true },
  });

  if (!host || host.followersCount < 5000) {
    throw new Error('This creator cannot accept subscriptions yet (needs 5K+ followers)');
  }

  const tierPrices = {
    BASIC: 500,
    PREMIUM: 1000,
    VIP: 2000,
  };

  const amount = tierPrices[tier];

  const subscription = await prisma.liveSubscription.create({
    data: {
      hostId,
      subscriberId,
      tier,
      amount,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  // Award badge
  await prisma.userBadge.create({
    data: {
      userId: subscriberId,
      hostId,
      badgeType: tier === 'VIP' ? 'VIP_MEMBER' : 'EARLY_SUPPORTER',
    },
  });

  return subscription;
}

/**
 * Create bulletin for subscribers
 */
export async function createBulletin(
  hostId: string,
  title: string,
  content: string,
  tier?: 'BASIC' | 'PREMIUM' | 'VIP',
  isPublic: boolean = false
) {
  return prisma.liveBulletin.create({
    data: {
      hostId,
      title,
      content,
      tier,
      isPublic,
      publishedAt: new Date(),
    },
  });
}

/**
 * Get bulletins for user
 */
export async function getUserBulletins(userId: string, hostId: string) {
  // Check subscription tier
  const subscription = await prisma.liveSubscription.findUnique({
    where: {
      hostId_subscriberId: {
        hostId,
        subscriberId: userId,
      },
    },
  });

  const tierRanking = { BASIC: 1, PREMIUM: 2, VIP: 3 };
  const userTier = subscription?.tier || null;

  return prisma.liveBulletin.findMany({
    where: {
      hostId,
      OR: [
        { isPublic: true },
        { tier: null }, // All subscribers
        { tier: userTier as any },
      ],
      publishedAt: { not: null },
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } },
      ],
    },
    orderBy: { publishedAt: 'desc' },
  });
}
