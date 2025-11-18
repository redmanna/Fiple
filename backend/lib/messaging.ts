// Messaging System - Direct Messages with Follow Restrictions
import prisma from './prisma';

/**
 * Check if user can send message to recipient
 * Rules:
 * - If users follow each other: unlimited messages
 * - If only sender follows: 1 message limit until recipient follows back
 * - If no follow relationship: cannot message
 */
export async function canSendMessage(senderId: string, recipientId: string): Promise<{
  allowed: boolean;
  reason?: string;
  remaining?: number;
}> {
  // Check if users follow each other
  const [senderFollowsRecipient, recipientFollowsSender] = await Promise.all([
    prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: senderId,
          followingId: recipientId,
        },
      },
    }),
    prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: recipientId,
          followingId: senderId,
        },
      },
    }),
  ]);

  // Mutual followers: unlimited messages
  if (senderFollowsRecipient && recipientFollowsSender) {
    return { allowed: true };
  }

  // Not following at all: cannot message
  if (!senderFollowsRecipient) {
    return {
      allowed: false,
      reason: 'You must follow this user to send messages',
    };
  }

  // Sender follows but recipient doesn't: check message limit
  const existingMessages = await prisma.message.count({
    where: {
      senderId,
      recipientId,
    },
  });

  if (existingMessages >= 1) {
    return {
      allowed: false,
      reason: 'You can only send 1 message until they follow you back',
      remaining: 0,
    };
  }

  return {
    allowed: true,
    remaining: 1,
  };
}

/**
 * Get or create conversation between two users
 */
export async function getOrCreateConversation(user1Id: string, user2Id: string) {
  // Always order IDs alphabetically for consistency
  const [participant1Id, participant2Id] = [user1Id, user2Id].sort();

  let conversation = await prisma.conversation.findUnique({
    where: {
      participant1Id_participant2Id: {
        participant1Id,
        participant2Id,
      },
    },
  });

  if (!conversation) {
    // Check if they can message
    const permission = await canSendMessage(user1Id, user2Id);

    conversation = await prisma.conversation.create({
      data: {
        participant1Id,
        participant2Id,
        canMessage: permission.allowed,
      },
    });
  }

  return conversation;
}

/**
 * Send a message
 */
export async function sendMessage(
  senderId: string,
  recipientId: string,
  content: string,
  mediaUrls?: string[],
  mediaTypes?: string[],
  replyToId?: string
) {
  // Check permission
  const permission = await canSendMessage(senderId, recipientId);
  if (!permission.allowed) {
    throw new Error(permission.reason);
  }

  // Get/create conversation
  const conversation = await getOrCreateConversation(senderId, recipientId);

  // Create message
  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId,
      recipientId,
      content,
      mediaUrls: mediaUrls || [],
      mediaTypes: mediaTypes || [],
      replyToId,
    },
    include: {
      replyTo: {
        select: {
          id: true,
          content: true,
          senderId: true,
        },
      },
    },
  });

  // Update conversation
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageText: content,
      lastMessageAt: new Date(),
      lastMessageBy: senderId,
    },
  });

  // Create notification for recipient
  await prisma.notification.create({
    data: {
      userId: recipientId,
      type: 'NEW_MESSAGE' as any,
      title: 'New Message',
      message: content.substring(0, 100),
      data: {
        senderId,
        messageId: message.id,
        conversationId: conversation.id,
      },
      actionUrl: `/messages/${conversation.id}`,
    },
  });

  return message;
}

/**
 * Get user's conversations (inbox)
 */
export async function getUserConversations(userId: string, page: number = 1, pageSize: number = 20) {
  const skip = (page - 1) * pageSize;

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { participant1Id: userId },
        { participant2Id: userId },
      ],
      lastMessageAt: { not: null },
    },
    orderBy: { lastMessageAt: 'desc' },
    skip,
    take: pageSize,
  });

  // Fetch participant details
  const conversationsWithDetails = await Promise.all(
    conversations.map(async (conv) => {
      const otherUserId = conv.participant1Id === userId ? conv.participant2Id : conv.participant1Id;

      const otherUser = await prisma.user.findUnique({
        where: { id: otherUserId! },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          verificationStatus: true,
        },
      });

      // Count unread messages
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conv.id,
          recipientId: userId,
          status: { not: 'READ' as any },
        },
      });

      return {
        ...conv,
        otherUser,
        unreadCount,
      };
    })
  );

  const total = await prisma.conversation.count({
    where: {
      OR: [
        { participant1Id: userId },
        { participant2Id: userId },
      ],
      lastMessageAt: { not: null },
    },
  });

  return {
    conversations: conversationsWithDetails,
    total,
    page,
    pageSize,
    hasMore: skip + conversations.length < total,
  };
}

/**
 * Get messages in a conversation
 */
export async function getConversationMessages(
  conversationId: string,
  userId: string,
  page: number = 1,
  pageSize: number = 50
) {
  // Verify user is participant
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      OR: [
        { participant1Id: userId },
        { participant2Id: userId },
      ],
    },
  });

  if (!conversation) {
    throw new Error('Conversation not found');
  }

  const skip = (page - 1) * pageSize;

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      deletedBy: { not: { has: userId } },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take: pageSize,
    include: {
      replyTo: {
        select: {
          id: true,
          content: true,
          senderId: true,
        },
      },
    },
  });

  // Mark messages as read
  await prisma.message.updateMany({
    where: {
      conversationId,
      recipientId: userId,
      status: { not: 'READ' as any },
    },
    data: {
      status: 'READ' as any,
      readAt: new Date(),
    },
  });

  const total = await prisma.message.count({
    where: {
      conversationId,
      deletedBy: { not: { has: userId } },
    },
  });

  return {
    messages: messages.reverse(), // Oldest first
    total,
    page,
    pageSize,
    hasMore: skip + messages.length < total,
  };
}

/**
 * Delete message (soft delete for specific user)
 */
export async function deleteMessage(messageId: string, userId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new Error('Message not found');
  }

  // Add user to deletedBy array
  const deletedBy = [...message.deletedBy, userId];

  await prisma.message.update({
    where: { id: messageId },
    data: {
      deletedBy,
      // If both users deleted, mark as fully deleted
      isDeleted: deletedBy.length >= 2,
    },
  });

  return { success: true };
}

/**
 * React to message
 */
export async function reactToMessage(messageId: string, userId: string, emoji: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });

  if (!message) {
    throw new Error('Message not found');
  }

  const reactions = (message.reactions as any) || {};

  if (!reactions[emoji]) {
    reactions[emoji] = [];
  }

  // Toggle reaction
  const index = reactions[emoji].indexOf(userId);
  if (index > -1) {
    reactions[emoji].splice(index, 1);
    if (reactions[emoji].length === 0) {
      delete reactions[emoji];
    }
  } else {
    reactions[emoji].push(userId);
  }

  await prisma.message.update({
    where: { id: messageId },
    data: { reactions },
  });

  return { reactions };
}
