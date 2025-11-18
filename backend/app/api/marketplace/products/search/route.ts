// GET /api/marketplace/products/search - Search products
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    const where: any = {
      status: 'ACTIVE',
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { hasSome: [query.toLowerCase()] } },
      ],
    };

    if (category) {
      where.category = category;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          merchant: {
            select: {
              id: true,
              businessName: true,
              rating: true,
              isVerified: true,
            },
          },
        },
        orderBy: [
          { salesCount: 'desc' },
          { rating: 'desc' },
        ],
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      query,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error searching products:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search products' },
      { status: 500 }
    );
  }
}
