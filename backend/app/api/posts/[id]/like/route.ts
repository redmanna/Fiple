// POST /api/posts/[id]/like - Like/unlike a post
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { withAuth, successResponse, errorResponse } from '@/lib/middleware';
import { ErrorCode } from '@/../../../../../../shared/types';
import { calculatePostScore } from '@/lib/feed-algorithm';
import { checkMilestones } from '@/lib/rewards';
import { createNotification } from '@/lib/notifications';
import { NotificationType } from '@prisma/client';

export const POST = withAuth(async (req: any, { params }: { params: { id: string } }) => {
  try {
    const postId = params.id;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { user: true },
    });

    if (!post) {
      return errorResponse('Post not found', ErrorCode.NOT_FOUND, 404);
    }

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: req.user.userId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { id: existingLike.id },
      });

      await prisma.post.update({
        where: { id: postId },
        data: {
          likesCount: { decrement: 1 },
        },
      });

      // Update post author's total likes
      await prisma.user.update({
        where: { id: post.userId },
        data: {
          totalLikes: { decrement: 1 },
        },
      });

      return successResponse({ liked: false });
    } else {
      // Like
      await prisma.like.create({
        data: {
          postId,
          userId: req.user.userId,
        },
      });

      await prisma.post.update({
        where: { id: postId },
        data: {
          likesCount: { increment: 1 },
        },
      });

      // Update post author's total likes
      await prisma.user.update({
        where: { id: post.userId },
        data: {
          totalLikes: { increment: 1 },
        },
      });

      // Notify post owner (if not self-like)
      if (post.userId !== req.user.userId) {
        const liker = await prisma.user.findUnique({
          where: { id: req.user.userId },
          select: { displayName: true },
        });

        await createNotification({
          userId: post.userId,
          type: NotificationType.NEW_LIKE,
          title: 'New Like',
          message: `${liker?.displayName} liked your post`,
          actionUrl: `/posts/${postId}`,
          data: { postId, likerId: req.user.userId },
        });
      }

      // Check for milestone achievements
      await checkMilestones(post.userId);

      // Recalculate post score
      await calculatePostScore(postId);

      return successResponse({ liked: true });
    }
  } catch (error) {
    console.error('Like error:', error);
    return errorResponse('Failed to like post', ErrorCode.SERVER_ERROR, 500);
  }
});
