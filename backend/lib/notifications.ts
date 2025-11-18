// Notification System
import prisma from './prisma';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  actionUrl?: string;
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data || {},
      actionUrl: params.actionUrl,
      isRead: false,
    },
  });
}

/**
 * Create bulk notifications (e.g., for all followers)
 */
export async function createBulkNotifications(
  userIds: string[],
  params: Omit<CreateNotificationParams, 'userId'>
) {
  const notifications = userIds.map(userId => ({
    userId,
    type: params.type,
    title: params.title,
    message: params.message,
    data: params.data || {},
    actionUrl: params.actionUrl,
    isRead: false,
  }));

  return prisma.notification.createMany({
    data: notifications,
  });
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

/**
 * Notify followers about new post
 */
export async function notifyFollowersNewPost(userId: string, postId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { displayName: true, username: true },
  });

  if (!user) return;

  // Get all followers
  const followers = await prisma.follow.findMany({
    where: { followingId: userId },
    select: { followerId: true },
  });

  const followerIds = followers.map(f => f.followerId);

  if (followerIds.length === 0) return;

  await createBulkNotifications(followerIds, {
    type: NotificationType.NEW_FOLLOWER,
    title: 'New Post',
    message: `${user.displayName} just posted something new`,
    actionUrl: `/posts/${postId}`,
    data: { postId, userId },
  });
}
