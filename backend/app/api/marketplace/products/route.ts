// GET /api/marketplace/products - Browse products with filters
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const merchantId = searchParams.get('merchantId');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sort = searchParams.get('sort') || 'recent'; // recent, popular, price_low, price_high
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'ACTIVE',
    };

    if (category) {
      where.category = category;
    }

    if (merchantId) {
      where.merchantId = merchantId;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'popular') {
      orderBy = { salesCount: 'desc' };
    } else if (sort === 'price_low') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price_high') {
      orderBy = { price: 'desc' };
    } else if (sort === 'rating') {
      orderBy = { rating: 'desc' };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
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
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
