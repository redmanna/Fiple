// Fiple Help & Documentation System
import prisma from './prisma';

/**
 * Create help article
 */
export async function createHelpArticle(data: {
  title: string;
  slug: string;
  category: string;
  content: string;
  tier: string; // USER, CREATOR, MERCHANT, ADMIN
  tags?: string[];
  authorId: string;
}) {
  return prisma.helpArticle.create({
    data: {
      title: data.title,
      slug: data.slug,
      category: data.category,
      content: data.content,
      tier: data.tier as any,
      tags: data.tags || [],
      authorId: data.authorId,
    },
  });
}

/**
 * Search help articles
 */
export async function searchHelpArticles(
  query: string,
  tier?: string,
  category?: string
) {
  const where: any = {
    isPublished: true,
  };

  if (tier) {
    where.tier = tier;
  }

  if (category) {
    where.category = category;
  }

  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { content: { contains: query, mode: 'insensitive' } },
      { tags: { hasSome: [query.toLowerCase()] } },
    ];
  }

  return prisma.helpArticle.findMany({
    where,
    orderBy: [
      { viewCount: 'desc' },
      { createdAt: 'desc' },
    ],
  });
}

/**
 * Get help article by slug
 */
export async function getHelpArticle(slug: string) {
  const article = await prisma.helpArticle.findUnique({
    where: { slug },
  });

  if (article) {
    // Increment view count
    await prisma.helpArticle.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
    });
  }

  return article;
}

/**
 * Create support ticket
 */
export async function createSupportTicket(
  userId: string,
  data: {
    category: string;
    priority: string;
    subject: string;
    description: string;
    attachments?: string[];
  }
) {
  const ticketNumber = `TICKET-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const ticket = await prisma.supportTicket.create({
    data: {
      userId,
      ticketNumber,
      category: data.category as any,
      priority: data.priority as any,
      subject: data.subject,
      description: data.description,
      attachments: data.attachments || [],
    },
  });

  // Create initial message
  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      senderId: userId,
      message: data.description,
      isInternal: false,
    },
  });

  // Auto-assign based on category
  await autoAssignTicket(ticket.id, data.category);

  return ticket;
}

/**
 * Auto-assign ticket to support team
 */
async function autoAssignTicket(ticketId: string, category: string) {
  // Simple round-robin assignment
  // In production, this would be more sophisticated
  const supportTeam = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    take: 1,
  });

  if (supportTeam.length > 0) {
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        assignedToId: supportTeam[0].id,
        status: 'ASSIGNED',
      },
    });
  }
}

/**
 * Get user's support tickets
 */
export async function getUserTickets(userId: string, status?: string) {
  const where: any = {
    userId,
  };

  if (status) {
    where.status = status;
  }

  return prisma.supportTicket.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get ticket details with messages
 */
export async function getTicketDetails(ticketId: string, userId: string) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      assignedTo: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
        },
      },
    },
  });

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  // Verify ownership or admin
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (ticket.userId !== userId && user?.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  // Get messages
  const messages = await prisma.ticketMessage.findMany({
    where: {
      ticketId,
      OR: [
        { isInternal: false },
        { senderId: userId },
      ],
    },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          role: true,
        },
      },
    },
  });

  return {
    ticket,
    messages,
  };
}

/**
 * Add message to ticket
 */
export async function addTicketMessage(
  ticketId: string,
  senderId: string,
  message: string,
  isInternal: boolean = false
) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
  });

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  const user = await prisma.user.findUnique({
    where: { id: senderId },
  });

  // Verify access
  if (ticket.userId !== senderId && user?.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  // Update ticket status
  if (ticket.status === 'PENDING' || ticket.status === 'ASSIGNED') {
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: user?.role === 'ADMIN' ? 'IN_PROGRESS' : 'ASSIGNED',
        lastResponseAt: new Date(),
      },
    });
  }

  return prisma.ticketMessage.create({
    data: {
      ticketId,
      senderId,
      message,
      isInternal,
    },
  });
}

/**
 * Resolve ticket
 */
export async function resolveTicket(
  ticketId: string,
  adminId: string,
  resolution: string
) {
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
  });

  if (!admin || admin.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }

  await prisma.ticketMessage.create({
    data: {
      ticketId,
      senderId: adminId,
      message: resolution,
      isInternal: false,
    },
  });

  return prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: 'RESOLVED',
      resolvedAt: new Date(),
    },
  });
}

/**
 * Get FAQs by category
 */
export async function getFAQs(category?: string, tier?: string) {
  const where: any = {
    isActive: true,
  };

  if (category) {
    where.category = category;
  }

  if (tier) {
    where.tier = tier;
  }

  return prisma.fAQ.findMany({
    where,
    orderBy: [
      { orderIndex: 'asc' },
      { viewCount: 'desc' },
    ],
  });
}

/**
 * Increment FAQ view count
 */
export async function incrementFAQView(faqId: string) {
  return prisma.fAQ.update({
    where: { id: faqId },
    data: { viewCount: { increment: 1 } },
  });
}

/**
 * Get help categories
 */
export async function getHelpCategories(tier?: string) {
  const where: any = {
    isPublished: true,
  };

  if (tier) {
    where.tier = tier;
  }

  const articles = await prisma.helpArticle.findMany({
    where,
    select: { category: true },
    distinct: ['category'],
  });

  return articles.map(a => a.category);
}
