// GET /api/affiliate/partnerships - View affiliate partnerships
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // PENDING, APPROVED, REJECTED

    const where: any = {
      creatorId: session.user.id,
    };

    if (status) {
      where.status = status;
    }

    const partnerships = await prisma.affiliatePartnership.findMany({
      where,
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true,
            businessType: true,
            rating: true,
            isVerified: true,
            affiliateRate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate totals
    const totals = {
      total: partnerships.length,
      pending: partnerships.filter(p => p.status === 'PENDING').length,
      approved: partnerships.filter(p => p.status === 'APPROVED').length,
      rejected: partnerships.filter(p => p.status === 'REJECTED').length,
      totalEarnings: partnerships.reduce((sum, p) => sum + p.totalEarnings, 0),
      pendingEarnings: partnerships.reduce((sum, p) => sum + p.pendingEarnings, 0),
      totalSales: partnerships.reduce((sum, p) => sum + p.totalSales, 0),
      totalOrders: partnerships.reduce((sum, p) => sum + p.totalOrders, 0),
    };

    return NextResponse.json({
      partnerships,
      totals,
    });
  } catch (error: any) {
    console.error('Error fetching partnerships:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch partnerships' },
      { status: 500 }
    );
  }
}
