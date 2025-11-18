// Feed Algorithm - Cultural Relevance & Engagement Scoring
import prisma from './prisma';
import { ContentType } from '@prisma/client';
import { getAdsForUser } from './advertising';

/**
 * Calculate post scores for feed ranking
 * Algorithm weights:
 * - Recency: 50% (fresh content prioritized)
 * - Cultural Relevance: 30% (local/campus content)
 * - Engagement: 20% (likes, comments, shares)
 */
export async function calculatePostScore(postId: string): Promise<void> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      campusHub: true,
    },
  });

  if (!post || post.status !== 'PUBLISHED') return;

  const now = new Date();
  const postAge = now.getTime() - post.createdAt.getTime();
  const hoursSincePost = postAge / (1000 * 60 * 60);

  // 1. RECENCY SCORE (0-100)
  // Posts lose points over time
  // Formula: 100 * e^(-0.1 * hours)
  const recencyScore = Math.max(0, 100 * Math.exp(-0.1 * hoursSincePost));

  // 2. CULTURAL RELEVANCE SCORE (0-100)
  let culturalScore = 0;

  // Nigerian-specific keywords (from system prompt)
  const nigerianKeywords = [
    'naija', 'sapa', 'japa', 'wahala', 'ginger', 'cruise', 'vibes',
    'detty', 'december', 'owambe', 'asoebi', 'amala', 'jollof',
    'lagos', 'abuja', 'portharcourt', 'ibadan', 'kano',
  ];

  const caption = post.caption?.toLowerCase() || '';
  const tags = post.tags.map(t => t.toLowerCase());
  const culturalTags = post.culturalTags.map(t => t.toLowerCase());

  // Check for Nigerian keywords in caption and tags
  const hasNigerianContent = nigerianKeywords.some(
    keyword =>
      caption.includes(keyword) ||
      tags.some(tag => tag.includes(keyword)) ||
      culturalTags.includes(keyword)
  );

  if (hasNigerianContent) {
    culturalScore += 40;
  }

  // Campus Hub content gets extra points
  if (post.campusHubId && post.campusHub) {
    culturalScore += 30;
  }

  // Location-tagged content
  if (post.location || post.isLocal) {
    culturalScore += 20;
  }

  // Trending hashtags (simplified - in production, track hashtag trends)
  if (post.hashtags.length > 0) {
    culturalScore += 10;
  }

  culturalScore = Math.min(100, culturalScore);

  // 3. ENGAGEMENT SCORE (0-100)
  // Normalized engagement relative to follower count
  const totalEngagement =
    post.likesCount * 1.0 +
    post.commentsCount * 2.0 + // Comments worth more
    post.sharesCount * 3.0 +    // Shares worth even more
    post.viewsCount * 0.1;

  // Engagement rate (relative to views)
  const engagementRate =
    post.viewsCount > 0
      ? ((post.likesCount + post.commentsCount + post.sharesCount) / post.viewsCount) * 100
      : 0;

  const engagementScore = Math.min(100, engagementRate * 10 + Math.log10(totalEngagement + 1) * 5);

  // 4. TOTAL SCORE (weighted average)
  const totalScore =
    recencyScore * 0.5 +
    culturalScore * 0.3 +
    engagementScore * 0.2;

  // Update post with scores
  await prisma.post.update({
    where: { id: postId },
    data: {
      recencyScore,
      culturalScore,
      engagementScore,
      totalScore,
    },
  });
}

/**
 * Get personalized feed for a user
 */
export interface GetFeedParams {
  userId?: string;
  page?: number;
  pageSize?: number;
  contentType?: ContentType;
  campusHubId?: string;
  sortBy?: 'recent' | 'trending' | 'top';
}

export async function getPersonalizedFeed(params: GetFeedParams) {
  const {
    userId,
    page = 1,
    pageSize = 20,
    contentType,
    campusHubId,
    sortBy = 'trending',
  } = params;

  const skip = (page - 1) * pageSize;

  // Base query
  const where: any = {
    status: 'PUBLISHED',
    publishedAt: { not: null },
  };

  // Filter by content type
  if (contentType) {
    where.contentType = contentType;
  }

  // Filter by campus hub
  if (campusHubId) {
    where.campusHubId = campusHubId;
  }

  // Filter out expired stories
  where.OR = [
    { expiresAt: null },
    { expiresAt: { gt: new Date() } },
  ];

  // Determine sorting
  let orderBy: any = {};

  switch (sortBy) {
    case 'recent':
      orderBy = { publishedAt: 'desc' };
      break;
    case 'trending':
      orderBy = { totalScore: 'desc' };
      break;
    case 'top':
      orderBy = { likesCount: 'desc' };
      break;
    default:
      orderBy = { totalScore: 'desc' };
  }

  // If user is logged in, prioritize content from their campus
  let userCampusId: string | null = null;
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { campusId: true },
    });
    userCampusId = user?.campusId || null;
  }

  // Get posts
  const posts = await prisma.post.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          currentTier: true,
          verificationStatus: true,
        },
      },
      campusHub: {
        select: {
          id: true,
          name: true,
          shortName: true,
          logo: true,
        },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
          shares: true,
        },
      },
    },
    orderBy,
    skip,
    take: pageSize,
  });

  // If user is logged in, add isLiked flag
  if (userId) {
    const postIds = posts.map(p => p.id);
    const userLikes = await prisma.like.findMany({
      where: {
        userId,
        postId: { in: postIds },
      },
      select: { postId: true },
    });

    const likedPostIds = new Set(userLikes.map(l => l.postId));

    posts.forEach((post: any) => {
      post.isLiked = likedPostIds.has(post.id);
    });
  }

  // Boost campus content in the feed
  if (userCampusId && sortBy === 'trending') {
    posts.sort((a, b) => {
      const aIsCampus = a.campusHubId === userCampusId;
      const bIsCampus = b.campusHubId === userCampusId;

      if (aIsCampus && !bIsCampus) return -1;
      if (!aIsCampus && bIsCampus) return 1;

      return (b.totalScore || 0) - (a.totalScore || 0);
    });
  }

  const total = await prisma.post.count({ where });

  return {
    posts,
    total,
    page,
    pageSize,
    hasMore: skip + posts.length < total,
  };
}

/**
 * Batch update scores for all recent posts
 * Should be run periodically (e.g., every 15 minutes)
 */
export async function updateAllPostScores(): Promise<void> {
  // Get posts from last 7 days that need score updates
  const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: { gte: cutoffDate },
    },
    select: { id: true },
  });

  console.log(`Updating scores for ${posts.length} posts...`);

  // Update scores in batches
  const batchSize = 50;
  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize);
    await Promise.all(batch.map(post => calculatePostScore(post.id)));
  }

  console.log('Score update complete');
}

/**
 * Get trending hashtags
 */
export async function getTrendingHashtags(limit: number = 10) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // This is a simplified version - in production, use a more efficient approach
  const recentPosts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: { gte: sevenDaysAgo },
    },
    select: {
      hashtags: true,
      likesCount: true,
      commentsCount: true,
    },
  });

  // Count hashtag occurrences and engagement
  const hashtagStats: Record<string, { count: number; engagement: number }> = {};

  recentPosts.forEach(post => {
    const engagement = post.likesCount + post.commentsCount * 2;

    post.hashtags.forEach(hashtag => {
      if (!hashtagStats[hashtag]) {
        hashtagStats[hashtag] = { count: 0, engagement: 0 };
      }
      hashtagStats[hashtag].count++;
      hashtagStats[hashtag].engagement += engagement;
    });
  });

  // Sort by combined score (count + engagement)
  const trending = Object.entries(hashtagStats)
    .map(([hashtag, stats]) => ({
      hashtag,
      count: stats.count,
      engagement: stats.engagement,
      score: stats.count * 0.4 + stats.engagement * 0.6,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return trending;
}

/**
 * Get personalized feed with ads injected
 */
export interface GetFeedWithAdsParams extends GetFeedParams {
  includeAds?: boolean;
  adFrequency?: number; // Show ad every N posts (default: 5)
}

export async function getPersonalizedFeedWithAds(params: GetFeedWithAdsParams) {
  const {
    userId,
    includeAds = true,
    adFrequency = 5,
    ...feedParams
  } = params;

  // Get regular posts
  const feedResult = await getPersonalizedFeed({ userId, ...feedParams });

  // If ads disabled or user not logged in, return posts only
  if (!includeAds || !userId) {
    return {
      ...feedResult,
      items: feedResult.posts.map(post => ({ type: 'post', data: post })),
    };
  }

  // Get ads for this user
  const numberOfAdsNeeded = Math.ceil(feedResult.posts.length / adFrequency);
  const ads = await getAdsForUser(userId, 'feed', numberOfAdsNeeded);

  // Inject ads into feed at regular intervals
  const items: Array<{ type: 'post' | 'ad'; data: any }> = [];
  let adIndex = 0;

  feedResult.posts.forEach((post, index) => {
    items.push({ type: 'post', data: post });

    // Insert ad every N posts
    if ((index + 1) % adFrequency === 0 && adIndex < ads.length) {
      items.push({ type: 'ad', data: ads[adIndex] });
      adIndex++;
    }
  });

  // Add any remaining ads at the end
  while (adIndex < ads.length) {
    items.push({ type: 'ad', data: ads[adIndex] });
    adIndex++;
  }

  return {
    items,
    total: feedResult.total,
    page: feedResult.page,
    pageSize: feedResult.pageSize,
    hasMore: feedResult.hasMore,
  };
}
