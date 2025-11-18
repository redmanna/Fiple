// GET /api/posts - Get posts (feed)
// POST /api/posts - Create a new post
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, successResponse, errorResponse, getPaginationParams } from '@/lib/middleware';
import { ErrorCode, ContentType, ContentStatus } from '@/../../../../shared/types';
import { calculatePostScore } from '@/lib/feed-algorithm';
import { notifyFollowersNewPost } from '@/lib/notifications';

export const GET = withAuth(async (req: any) => {
  try {
    const { searchParams } = new URL(req.url);
    const { page, pageSize, skip, take } = getPaginationParams(new URL(req.url));

    const contentType = searchParams.get('contentType') as ContentType | null;
    const campusHubId = searchParams.get('campusHubId');
    const userId = searchParams.get('userId');

    const where: any = {
      status: ContentStatus.PUBLISHED,
      publishedAt: { not: null },
    };

    if (contentType) {
      where.contentType = contentType;
    }

    if (campusHubId) {
      where.campusHubId = campusHubId;
    }

    if (userId) {
      where.userId = userId;
    }

    // Filter out expired stories
    where.OR = [
      { expiresAt: null },
      { expiresAt: { gt: new Date() } },
    ];

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
      },
      orderBy: { totalScore: 'desc' },
      skip,
      take,
    });

    // Add isLiked flag
    const postIds = posts.map(p => p.id);
    const userLikes = await prisma.like.findMany({
      where: {
        userId: req.user.userId,
        postId: { in: postIds },
      },
      select: { postId: true },
    });

    const likedPostIds = new Set(userLikes.map(l => l.postId));

    const postsWithLikes = posts.map(post => ({
      ...post,
      isLiked: likedPostIds.has(post.id),
    }));

    const total = await prisma.post.count({ where });

    return successResponse({
      data: postsWithLikes,
      total,
      page,
      pageSize,
      hasMore: skip + posts.length < total,
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return errorResponse('Failed to get posts', ErrorCode.SERVER_ERROR, 500);
  }
});

export const POST = withAuth(async (req: any) => {
  try {
    const body = await req.json();
    const {
      contentType,
      caption,
      mediaUrls,
      mediaTypes,
      tags,
      hashtags,
      campusHubId,
      expiresAt,
    } = body;

    // Validate content type
    if (!contentType || !Object.values(ContentType).includes(contentType)) {
      return errorResponse(
        'Invalid content type',
        ErrorCode.VALIDATION_ERROR,
        400
      );
    }

    // Create post
    const post = await prisma.post.create({
      data: {
        userId: req.user.userId,
        contentType,
        caption,
        mediaUrls: mediaUrls || [],
        mediaTypes: mediaTypes || [],
        tags: tags || [],
        hashtags: hashtags || [],
        campusHubId,
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            currentTier: true,
          },
        },
        campusHub: true,
      },
    });

    // Update user post count
    await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        postsCount: { increment: 1 },
      },
    });

    // Update campus hub post count
    if (campusHubId) {
      await prisma.campusHub.update({
        where: { id: campusHubId },
        data: {
          postsCount: { increment: 1 },
        },
      });
    }

    // Calculate initial post score
    await calculatePostScore(post.id);

    // Notify followers (async, don't wait)
    notifyFollowersNewPost(req.user.userId, post.id).catch(console.error);

    return successResponse(post, 201);
  } catch (error) {
    console.error('Create post error:', error);
    return errorResponse('Failed to create post', ErrorCode.SERVER_ERROR, 500);
  }
});
