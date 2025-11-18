// GET /api/marketplace/products/[id] - Product details
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true,
            businessType: true,
            rating: true,
            isVerified: true,
            totalProducts: true,
            totalSales: true,
            responseTime: true,
          },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                profilePictureUrl: true,
                isVerified: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (product.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Product is not available' },
        { status: 400 }
      );
    }

    // Increment view count
    await prisma.product.update({
      where: { id: params.id },
      data: { viewsCount: { increment: 1 } },
    });

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
