// Fiple Marketplace System
import prisma from './prisma';

/**
 * Create merchant account
 */
export async function createMerchantAccount(
  userId: string,
  data: {
    businessName: string;
    businessType: string;
    businessEmail: string;
    businessPhone: string;
    businessAddress?: string;
  }
) {
  // Check if user already has merchant account
  const existing = await prisma.merchantAccount.findUnique({
    where: { userId },
  });

  if (existing) {
    throw new Error('Merchant account already exists');
  }

  return prisma.merchantAccount.create({
    data: {
      userId,
      ...data,
    },
  });
}

/**
 * Create product
 */
export async function createProduct(merchantId: string, productData: any) {
  // Verify merchant exists
  const merchant = await prisma.merchantAccount.findUnique({
    where: { id: merchantId },
  });

  if (!merchant) {
    throw new Error('Merchant account not found');
  }

  if (!merchant.isVerified) {
    throw new Error('Merchant account must be verified to list products');
  }

  const product = await prisma.product.create({
    data: {
      merchantId,
      ...productData,
      slug: generateSlug(productData.name),
    },
  });

  // Update merchant product count
  await prisma.merchantAccount.update({
    where: { id: merchantId },
    data: {
      totalProducts: { increment: 1 },
    },
  });

  return product;
}

/**
 * Add to cart
 */
export async function addToCart(
  userId: string,
  productId: string,
  quantity: number = 1,
  selectedVariant?: any
) {
  // Get or create cart
  let cart = await prisma.shoppingCart.findUnique({
    where: { userId },
  });

  if (!cart) {
    cart = await prisma.shoppingCart.create({
      data: { userId },
    });
  }

  // Get product
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product || product.status !== 'ACTIVE') {
    throw new Error('Product not available');
  }

  if (product.stock < quantity) {
    throw new Error('Insufficient stock');
  }

  // Check if item already in cart
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId,
    },
  });

  if (existingItem) {
    // Update quantity
    return prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: { increment: quantity },
      },
    });
  }

  // Add new item
  return prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId,
      merchantId: product.merchantId,
      quantity,
      selectedVariant,
      priceSnapshot: product.price,
    },
  });
}

/**
 * Get cart with calculated totals
 */
export async function getCart(userId: string) {
  const cart = await prisma.shoppingCart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          // We'll need to fetch product details separately
        },
      },
    },
  });

  if (!cart) {
    return null;
  }

  // Fetch product details for each item
  const itemsWithDetails = await Promise.all(
    cart.items.map(async item => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
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

      return {
        ...item,
        product,
        subtotal: item.priceSnapshot * item.quantity,
      };
    })
  );

  const subtotal = itemsWithDetails.reduce((sum, item) => sum + item.subtotal, 0);

  return {
    ...cart,
    items: itemsWithDetails,
    subtotal,
    totalItems: cart.items.length,
  };
}

/**
 * Create order from cart
 */
export async function createOrder(
  userId: string,
  data: {
    shippingAddress: any;
    shippingMethod: string;
    discountCode?: string;
    affiliateCode?: string;
  }
) {
  const cart = await getCart(userId);

  if (!cart || cart.items.length === 0) {
    throw new Error('Cart is empty');
  }

  // Group items by merchant (one order per merchant)
  const itemsByMerchant: Record<string, any[]> = {};
  cart.items.forEach(item => {
    if (!itemsByMerchant[item.merchantId]) {
      itemsByMerchant[item.merchantId] = [];
    }
    itemsByMerchant[item.merchantId].push(item);
  });

  const orders = [];

  // Create order for each merchant
  for (const [merchantId, items] of Object.entries(itemsByMerchant)) {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

    // Calculate shipping
    const shippingFee = calculateShippingFee(data.shippingAddress, data.shippingMethod);

    // Apply discount if provided
    let discount = 0;
    if (data.discountCode) {
      discount = await applyDiscountCode(data.discountCode, subtotal, merchantId);
    }

    // Track affiliate
    let affiliateId, affiliateEarning;
    if (data.affiliateCode) {
      const affiliate = await prisma.affiliatePartnership.findUnique({
        where: { affiliateCode: data.affiliateCode },
      });

      if (affiliate && affiliate.merchantId === merchantId && affiliate.status === 'APPROVED') {
        affiliateId = affiliate.creatorId;
        affiliateEarning = ((subtotal - discount) * affiliate.commissionRate) / 100;
      }
    }

    const total = subtotal - discount + shippingFee;

    // Generate order number
    const orderNumber = `FIP${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        merchantId,
        items: items.map(item => ({
          productId: item.productId,
          name: item.product.name,
          price: item.priceSnapshot,
          quantity: item.quantity,
          variant: item.selectedVariant,
        })),
        subtotal,
        discount,
        discountCode: data.discountCode,
        shippingFee,
        total,
        shippingAddress: data.shippingAddress,
        shippingMethod: data.shippingMethod,
        paymentRef: generatePaymentRef(),
        affiliateId,
        affiliateCode: data.affiliateCode,
        affiliateEarning,
      },
    });

    orders.push(order);
  }

  // Clear cart
  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });

  return orders;
}

/**
 * Process order payment
 */
export async function processOrderPayment(orderId: string, paymentData: any) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.paymentStatus === 'PAID') {
    throw new Error('Order already paid');
  }

  // Update order
  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'PAID',
      status: 'PROCESSING',
      paidAt: new Date(),
    },
  });

  // Update product stock
  const items = order.items as any[];
  for (const item of items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: {
        stock: { decrement: item.quantity },
        salesCount: { increment: item.quantity },
      },
    });
  }

  // Update merchant metrics
  await prisma.merchantAccount.update({
    where: { id: order.merchantId },
    data: {
      totalSales: { increment: order.total },
      totalOrders: { increment: 1 },
    },
  });

  // Update affiliate earnings if applicable
  if (order.affiliateId && order.affiliateEarning) {
    await prisma.affiliatePartnership.update({
      where: {
        creatorId_merchantId: {
          creatorId: order.affiliateId,
          merchantId: order.merchantId,
        },
      },
      data: {
        totalSales: { increment: order.total },
        totalOrders: { increment: 1 },
        pendingEarnings: { increment: order.affiliateEarning },
      },
    });
  }

  return order;
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
  trackingNumber?: string
) {
  const updateData: any = { status };

  if (status === 'SHIPPED' && trackingNumber) {
    updateData.shippedAt = new Date();
    updateData.trackingNumber = trackingNumber;
  }

  if (status === 'DELIVERED') {
    updateData.deliveredAt = new Date();

    // Mark affiliate earnings as confirmed
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (order && order.affiliateId && order.affiliateEarning) {
      await prisma.affiliatePartnership.update({
        where: {
          creatorId_merchantId: {
            creatorId: order.affiliateId,
            merchantId: order.merchantId,
          },
        },
        data: {
          pendingEarnings: { decrement: order.affiliateEarning },
          totalEarnings: { increment: order.affiliateEarning },
        },
      });

      // Add to creator's wallet
      await prisma.wallet.update({
        where: { userId: order.affiliateId },
        data: {
          balanceNGN: { increment: order.affiliateEarning },
          totalEarned: { increment: order.affiliateEarning },
        },
      });
    }

    // Update merchant completed orders
    if (order) {
      await prisma.merchantAccount.update({
        where: { id: order.merchantId },
        data: {
          completedOrders: { increment: 1 },
        },
      });
    }
  }

  return prisma.order.update({
    where: { id: orderId },
    data: updateData,
  });
}

// Helper functions
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') +
    '-' +
    Math.random().toString(36).substring(7);
}

function generatePaymentRef(): string {
  return `PAY${Date.now()}${Math.floor(Math.random() * 10000)}`;
}

function calculateShippingFee(address: any, method: string): number {
  // Basic shipping calculation (can be made more sophisticated)
  const baseRates: Record<string, number> = {
    standard: 1000,
    express: 2500,
  };

  return baseRates[method.toLowerCase()] || 1000;
}

async function applyDiscountCode(
  code: string,
  subtotal: number,
  merchantId: string
): Promise<number> {
  const discountCode = await prisma.discountCode.findUnique({
    where: { code },
  });

  if (!discountCode || !discountCode.isActive) {
    return 0;
  }

  if (discountCode.merchantId !== merchantId) {
    return 0;
  }

  // Check validity
  const now = new Date();
  if (discountCode.validFrom > now) {
    return 0;
  }

  if (discountCode.validUntil && discountCode.validUntil < now) {
    return 0;
  }

  // Check uses
  if (discountCode.maxUses && discountCode.usesCount >= discountCode.maxUses) {
    return 0;
  }

  // Check minimum purchase
  if (discountCode.minPurchase && subtotal < discountCode.minPurchase) {
    return 0;
  }

  // Calculate discount
  let discount = 0;
  if (discountCode.discountType === 'PERCENTAGE') {
    discount = (subtotal * discountCode.discountValue) / 100;
    if (discountCode.maxDiscount) {
      discount = Math.min(discount, discountCode.maxDiscount);
    }
  } else {
    discount = discountCode.discountValue;
  }

  // Update uses count
  await prisma.discountCode.update({
    where: { code },
    data: {
      usesCount: { increment: 1 },
    },
  });

  return discount;
}

/**
 * Create product review
 */
export async function createProductReview(
  userId: string,
  productId: string,
  orderId: string,
  data: { rating: number; title?: string; review?: string; images?: string[] }
) {
  // Verify order exists and is delivered
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
      status: 'DELIVERED',
    },
  });

  if (!order) {
    throw new Error('Order not found or not delivered');
  }

  const review = await prisma.productReview.create({
    data: {
      productId,
      userId,
      orderId,
      ...data,
      isVerified: true, // Verified purchase
    },
  });

  // Update product rating
  await updateProductRating(productId);

  return review;
}

async function updateProductRating(productId: string) {
  const reviews = await prisma.productReview.findMany({
    where: { productId },
    select: { rating: true },
  });

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: averageRating,
      reviewsCount: reviews.length,
    },
  });
}
