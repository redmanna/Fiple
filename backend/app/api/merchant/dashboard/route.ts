// GET /api/merchant/dashboard - Business analytics
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const merchant = await prisma.merchantAccount.findUnique({
      where: { userId: session.user.id },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant account not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get orders statistics
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      prisma.order.count({
        where: {
          merchantId: merchant.id,
          createdAt: { gte: startDate },
        },
      }),
      prisma.order.count({
        where: {
          merchantId: merchant.id,
          status: 'PENDING',
        },
      }),
      prisma.order.count({
        where: {
          merchantId: merchant.id,
          status: 'PROCESSING',
        },
      }),
      prisma.order.count({
        where: {
          merchantId: merchant.id,
          status: 'SHIPPED',
        },
      }),
      prisma.order.count({
        where: {
          merchantId: merchant.id,
          status: 'DELIVERED',
        },
      }),
      prisma.order.count({
        where: {
          merchantId: merchant.id,
          status: 'CANCELLED',
        },
      }),
      prisma.order.findMany({
        where: {
          merchantId: merchant.id,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
        },
      }),
      prisma.product.findMany({
        where: {
          merchantId: merchant.id,
        },
        orderBy: { salesCount: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          price: true,
          salesCount: true,
          stock: true,
          images: true,
        },
      }),
    ]);

    // Calculate revenue
    const orders = await prisma.order.findMany({
      where: {
        merchantId: merchant.id,
        paymentStatus: 'PAID',
        createdAt: { gte: startDate },
      },
      select: { total: true },
    });

    const revenue = orders.reduce((sum, order) => sum + order.total, 0);

    // Get affiliate statistics
    const affiliateStats = await prisma.affiliatePartnership.aggregate({
      where: {
        merchantId: merchant.id,
        status: 'APPROVED',
      },
      _count: true,
      _sum: {
        totalSales: true,
        totalOrders: true,
      },
    });

    return NextResponse.json({
      overview: {
        totalSales: merchant.totalSales,
        totalOrders: merchant.totalOrders,
        completedOrders: merchant.completedOrders,
        totalProducts: merchant.totalProducts,
        rating: merchant.rating,
        revenue,
        period: parseInt(period),
      },
      orderStats: {
        total: totalOrders,
        pending: pendingOrders,
        processing: processingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
      affiliateStats: {
        totalAffiliates: affiliateStats._count,
        affiliateSales: affiliateStats._sum.totalSales || 0,
        affiliateOrders: affiliateStats._sum.totalOrders || 0,
      },
      recentOrders,
      topProducts,
    });
  } catch (error: any) {
    console.error('Error fetching merchant dashboard:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard' },
      { status: 500 }
    );
  }
}
