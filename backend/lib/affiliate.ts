// Fiple Affiliate Marketing System - 2,500+ Followers Requirement
import prisma from './prisma';

const MIN_FOLLOWERS_REQUIRED = 2500;

/**
 * Apply for affiliate partnership
 */
export async function applyForAffiliate(
  creatorId: string,
  merchantId: string,
  applicationNote?: string
) {
  // Check follower count
  const creator = await prisma.user.findUnique({
    where: { id: creatorId },
    select: { followersCount: true, username: true },
  });

  if (!creator) {
    throw new Error('Creator not found');
  }

  if (creator.followersCount < MIN_FOLLOWERS_REQUIRED) {
    throw new Error(
      `You need at least ${MIN_FOLLOWERS_REQUIRED} followers to become an affiliate. Current: ${creator.followersCount}`
    );
  }

  // Check if already applied
  const existing = await prisma.affiliatePartnership.findUnique({
    where: {
      creatorId_merchantId: {
        creatorId,
        merchantId,
      },
    },
  });

  if (existing) {
    throw new Error('Already applied to this merchant');
  }

  // Get merchant settings
  const merchant = await prisma.merchantAccount.findUnique({
    where: { id: merchantId },
  });

  if (!merchant || !merchant.affiliateEnabled) {
    throw new Error('Merchant does not have affiliate program enabled');
  }

  // Generate unique affiliate code
  const affiliateCode = generateAffiliateCode(creator.username);

  return prisma.affiliatePartnership.create({
    data: {
      creatorId,
      merchantId,
      applicationNote,
      commissionRate: merchant.affiliateRate,
      affiliateCode,
      affiliateLink: `https://fiple.com/shop/${merchantId}?ref=${affiliateCode}`,
    },
  });
}

/**
 * Approve affiliate application
 */
export async function approveAffiliate(partnershipId: string, merchantUserId: string) {
  const partnership = await prisma.affiliatePartnership.findUnique({
    where: { id: partnershipId },
    include: { merchant: true },
  });

  if (!partnership) {
    throw new Error('Partnership not found');
  }

  if (partnership.merchant.userId !== merchantUserId) {
    throw new Error('Unauthorized');
  }

  if (partnership.status !== 'PENDING') {
    throw new Error('Partnership is not pending');
  }

  return prisma.affiliatePartnership.update({
    where: { id: partnershipId },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
    },
  });
}

/**
 * Reject affiliate application
 */
export async function rejectAffiliate(
  partnershipId: string,
  merchantUserId: string,
  reason: string
) {
  const partnership = await prisma.affiliatePartnership.findUnique({
    where: { id: partnershipId },
    include: { merchant: true },
  });

  if (!partnership) {
    throw new Error('Partnership not found');
  }

  if (partnership.merchant.userId !== merchantUserId) {
    throw new Error('Unauthorized');
  }

  return prisma.affiliatePartnership.update({
    where: { id: partnershipId },
    data: {
      status: 'REJECTED',
      rejectionReason: reason,
    },
  });
}

/**
 * Create live product showcase
 */
export async function createLiveShowcase(
  streamId: string,
  productId: string,
  creatorId: string
) {
  // Verify product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product || product.status !== 'ACTIVE') {
    throw new Error('Product not available');
  }

  if (!product.allowAffiliate) {
    throw new Error('Product does not allow affiliate promotion');
  }

  // Check if creator has approved partnership with merchant
  const partnership = await prisma.affiliatePartnership.findUnique({
    where: {
      creatorId_merchantId: {
        creatorId,
        merchantId: product.merchantId,
      },
    },
  });

  if (!partnership || partnership.status !== 'APPROVED') {
    throw new Error('No approved affiliate partnership with this merchant');
  }

  return prisma.liveProductShowcase.create({
    data: {
      streamId,
      productId,
      creatorId,
      partnershipId: partnership.id,
    },
  });
}

/**
 * Track affiliate click
 */
export async function trackAffiliateClick(affiliateCode: string, productId?: string) {
  const partnership = await prisma.affiliatePartnership.findUnique({
    where: { affiliateCode },
  });

  if (!partnership) {
    return;
  }

  await prisma.affiliatePartnership.update({
    where: { id: partnership.id },
    data: {
      totalClicks: { increment: 1 },
    },
  });

  // Track specific product showcase if in live stream
  if (productId) {
    const showcase = await prisma.liveProductShowcase.findFirst({
      where: {
        productId,
        creatorId: partnership.creatorId,
        isActive: true,
      },
    });

    if (showcase) {
      await prisma.liveProductShowcase.update({
        where: { id: showcase.id },
        data: {
          clicks: { increment: 1 },
        },
      });
    }
  }
}

/**
 * Track affiliate sale (called from order processing)
 */
export async function trackAffiliateSale(
  orderId: string,
  affiliateCode: string,
  totalAmount: number,
  commission: number
) {
  const partnership = await prisma.affiliatePartnership.findUnique({
    where: { affiliateCode },
  });

  if (!partnership) {
    return;
  }

  await prisma.affiliatePartnership.update({
    where: { id: partnership.id },
    data: {
      totalSales: { increment: totalAmount },
      totalOrders: { increment: 1 },
      pendingEarnings: { increment: commission },
    },
  });

  // Track showcase metrics if applicable
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (order) {
    const items = order.items as any[];
    for (const item of items) {
      const showcase = await prisma.liveProductShowcase.findFirst({
        where: {
          productId: item.productId,
          creatorId: partnership.creatorId,
          isActive: true,
        },
      });

      if (showcase) {
        const itemTotal = item.price * item.quantity;
        const itemCommission = (itemTotal * partnership.commissionRate) / 100;

        await prisma.liveProductShowcase.update({
          where: { id: showcase.id },
          data: {
            sales: { increment: 1 },
            revenue: { increment: itemTotal },
            earnings: { increment: itemCommission },
          },
        });
      }
    }
  }
}

/**
 * Get affiliate earnings dashboard
 */
export async function getAffiliateEarnings(creatorId: string) {
  const partnerships = await prisma.affiliatePartnership.findMany({
    where: {
      creatorId,
      status: 'APPROVED',
    },
    include: {
      merchant: {
        select: {
          id: true,
          businessName: true,
          rating: true,
        },
      },
    },
  });

  const totalPending = partnerships.reduce((sum, p) => sum + p.pendingEarnings, 0);
  const totalEarned = partnerships.reduce((sum, p) => sum + p.totalEarnings, 0);
  const totalOrders = partnerships.reduce((sum, p) => sum + p.totalOrders, 0);

  return {
    partnerships,
    summary: {
      totalPending,
      totalEarned,
      lifetimeEarnings: totalPending + totalEarned,
      totalOrders,
    },
  };
}

/**
 * Payout affiliate earnings
 */
export async function payoutAffiliateEarnings(creatorId: string, amount: number) {
  const partnerships = await prisma.affiliatePartnership.findMany({
    where: {
      creatorId,
      status: 'APPROVED',
      pendingEarnings: { gt: 0 },
    },
  });

  const totalPending = partnerships.reduce((sum, p) => sum + p.pendingEarnings, 0);

  if (amount > totalPending) {
    throw new Error('Insufficient pending earnings');
  }

  // Minimum payout threshold
  if (amount < 1000) {
    throw new Error('Minimum payout is ₦1,000');
  }

  // Process payout proportionally
  for (const partnership of partnerships) {
    const proportion = partnership.pendingEarnings / totalPending;
    const payoutAmount = amount * proportion;

    await prisma.affiliatePartnership.update({
      where: { id: partnership.id },
      data: {
        pendingEarnings: { decrement: payoutAmount },
        totalEarnings: { increment: payoutAmount },
      },
    });
  }

  // Add to wallet
  await prisma.wallet.update({
    where: { userId: creatorId },
    data: {
      balanceNGN: { increment: amount },
      totalEarned: { increment: amount },
    },
  });

  // Create transaction
  await prisma.transaction.create({
    data: {
      userId: creatorId,
      type: 'SKILL_PAYMENT_RECEIVED' as any, // Use closest type
      status: 'COMPLETED' as any,
      amount,
      netAmount: amount,
      description: 'Affiliate commission payout',
      reference: `AFF${Date.now()}`,
      completedAt: new Date(),
    },
  });

  return { success: true, amount };
}

// Helper function
function generateAffiliateCode(username: string): string {
  const cleaned = username.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${cleaned}${random}`;
}
